# coding: UTF-8
import os
import time
import json
import random
import dataclasses
from dataclasses import dataclass
from typing import List
from pathlib import Path

import boto3


_DEFAULT_RESOURCE = boto3.resource('dynamodb')
_DEFAULT_TABLENAME = os.environ['TableName']


def lambda_handler(event, context):
    print('RECIVE', dict(event))
    method = event['requestContext']['http']['method']
    query = event.get('queryStringParameters', {})
    body = json.loads(event.get('body', '{}'))
    obj = Codenames()
    result = obj.dispatcher(method, body=body, **query)
    print('SEND', result)
    return json.dumps(result)


GRAY = 0
RED = 1
BLUE = 2
BLACK = 4
with (Path(__file__).parent / 'codenames.json').open() as f:
    WORDS = json.load(f)

@dataclass
class CodenamesData:
    PK: str
    SK: int
    status: str
    text: List[str]
    color: List[int]
    chosen: List[int]
    ttl: int = 0

    @classmethod
    def new(cls, SK=1, alive=3600*24*3):
        obj = cls('Codenames', SK,
            'created',
            ['']*25,
            [0]*25,
            [])
        obj.random_all_color()
        for i in range(25):
            obj.random_text(i)
        obj.ttl = int(time.time() + alive)
        return obj

    def asdict(self) -> dict:
        d = dataclasses.asdict(self)
        d['SK'] = int(d['SK'])
        d['ttl'] = int(d['ttl'])
        d['color'] = [int(x) for x in d['color']]
        d['chosen'] = [int(x) for  x in d['chosen']]
        return d

    def random_text(self, i):
        s = ','.join(self.text)
        for _ in range(10):
            x = random.choice(WORDS)
            if x not in s:
                break
        self.text[i] = x

    def random_all_color(self):
        arr = list(range(25))
        random.shuffle(arr)
        for i, x in enumerate(arr):
            if i < 7:
                self.color[x] = RED
            elif i < 14:
                self.color[x] = BLUE
            else:
                break
        self.color[arr[14]] = BLACK
        self.color[arr[15]] = random.choice([RED, BLUE])


class Codenames:
    """
    """
    GAME = 'Codenames'
    META = {'PK': 'META', 'SK': -1}

    ACTIONS = ['sync', 'create', 'change', 'pick']
    def __init__(self, dyn_resource=_DEFAULT_RESOURCE, table_name=_DEFAULT_TABLENAME):
        self.dyn_resource = dyn_resource
        self.table_name = table_name
        self.table = dyn_resource.Table(table_name)

    def dispatcher(self, method, action=None, **kwargs):
        if method == 'POST':
            if action in self.ACTIONS:
                func = getattr(self, action)
                return func(**kwargs)
            else:
                return {'failed': f'unsupported action: {action}'}
        else:
            return {'failed': 'unsupported method: ' + method}

    def sync(self, no: int, **kwargs):
        key = {'PK': self.GAME, 'SK': int(no)}
        response = self.table.get_item(Key=key)
        item = response.get('Item')
        if item is None:
            return {'failed': f'session number not found: {no}'}
        obj = CodenamesData(**item)
        return obj.asdict()

    def create(self, **kwargs) -> dict:
        obj = CodenamesData.new()
        resp = self.table.update_item(
            Key=self.META,
            UpdateExpression='ADD LastID :inc',
            ExpressionAttributeValues={':inc': 1},
            ReturnValues="UPDATED_NEW"
        )
        obj.SK = resp['Attributes']['LastID']
        item = obj.asdict()
        self.table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(SK)",
        )
        return {'success': 1, 'no': int(obj.SK)}

    def change(self, no: int, body, **kwargs):
        key = {'PK': self.GAME, 'SK': int(no)}
        response = self.table.get_item(Key=key)
        item = response.get('Item')
        obj = CodenamesData(**item)
        card = int(body['card'])
        obj.random_text(card)
        new_value = obj.text[card]
        self.table.update_item(
            Key=key,
            UpdateExpression=f'SET #k[{card}] = :v',
            ExpressionAttributeValues={':v': new_value},
            ExpressionAttributeNames={'#k': 'text'}
        )
        return {'success': 1, 'newValue': new_value}

    def pick(self, no: int, body, **kwargs):
        key = {'PK': self.GAME, 'SK': int(no)}
        response = self.table.get_item(Key=key)
        item = response.get('Item')
        obj = CodenamesData(**item)
        card = int(body['card'])
        if card in obj.chosen:
            return {'failed': 1}
        obj.chosen.append(card)
        self.table.update_item(
            Key=key,
            UpdateExpression='SET #k = list_append(#k,:vals)',
            ExpressionAttributeValues={':vals': [card]},
            ExpressionAttributeNames={'#k': 'chosen'}
        )
        return {'success': 1}
