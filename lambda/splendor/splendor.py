# coding: UTF-8
import json
import os

import boto3
from models import Splendor

_DEFAULT_RESOURCE = boto3.resource('dynamodb')
_DEFAULT_TABLENAME = os.environ['TableName']


def lambda_handler(event, context):
    print('RECIVE', dict(event))
    method = event['requestContext']['http']['method']
    query = event.get('queryStringParameters', {})
    body = json.loads(event.get('body', '{}'))
    obj = Handler()
    result = obj.dispatcher(method, body=body, **query)
    print('SEND', result)
    return json.dumps(result)


class Handler:
    GAME = 'Splendor'
    META = {'PK': 'META', 'SK': -1}

    ACTIONS = [
        'sync',
        'create',
        'pick_coin',
        'keep_card',
        'purchase_lord',
        'purchase_mine',
        'purchase_keep'
    ]

    def __init__(self, dyn_resource=_DEFAULT_RESOURCE, table_name=_DEFAULT_TABLENAME):
        self.dyn_resource = dyn_resource
        self.table_name = table_name
        self.table = dyn_resource.Table(table_name)

    def dispatcher(self, method, action=None, **kwargs):
        if method == 'GET':
            return self.get()
        elif method == 'POST':
            if action in self.ACTIONS:
                func = getattr(self, action)
                return func(**kwargs)
            else:
                return {'failed': f'unsupported action: {action}'}
        else:
            return {'failed': 'unsupported method: ' + method}

    def get(self):
        pass
