import os
import time
import json
from typing import List

import boto3
from boto3.dynamodb.types import Decimal
from boto3.dynamodb.conditions import Key

_DEFAULT_RESOURCE = boto3.resource('dynamodb')
_DEFAULT_TABLENAME = os.environ.get('TableName', 'd-comment')


def lambda_handler(event, context):
    print('RECIVE', dict(event))
    method = event['requestContext']['http']['method']
    origin = event['headers']['origin']
    x_page = event['headers']['x-referer-page']
    page = origin + x_page
    query = event.get('queryStringParameters', {})
    body = json.loads(event.get('body', '{}'))
    if 'origin' not in query:
        query['origin'] = origin
    obj = DComment()
    result = obj.handler(method, page, query, body)
    print('SEND', result)
    return json.dumps(result)


def _decimal_to_int(d):
    for k, v in list(d.items()):
        if isinstance(v, Decimal):
            d[k] = int(v)
    return d


class DComment:
    COMMENT_META_PAGE = 'Metadata'
    COMMENT_META_CID = 0
    VC_GET = 'VCGet'
    VC_UPDATE = 'VCUpdate'
    VC_RANKING = 'VCRanking'
    VC_CID = -1
    VC_EMPTY = {'LastVisit': 0, 'Counter': 0}

    def __init__(self, dyn_resource=_DEFAULT_RESOURCE, table_name=_DEFAULT_TABLENAME):
        self.dyn_resource = dyn_resource
        self.table_name = table_name
        self.table = dyn_resource.Table(table_name)

    def handler(self, method, page, query={}, body={}):
        action = query.get("action")
        if method == "GET":
            if action == self.VC_GET:
                return self.get_visitor_counter(page)
            elif action == self.VC_RANKING:
                return self.get_visitor_ranking(**query)
            elif action == self.VC_UPDATE:
                return self.update_visitor_counter(page, **query)
            else:
                return self.list_comments(page, **query)
        elif method == "POST":
            return self.post_comments(page, **body)
        else:
            raise ValueError(f"Invalid method: {method}")

    def get_visitor_counter(self, page: str) -> dict:
        response = self.table.get_item(Key={'page': page, 'cid': self.VC_CID})
        resp = response.get('Item', self.VC_EMPTY)
        return _decimal_to_int(resp)

    def get_visitor_ranking(self, origin: str, **kwargs) -> dict:
        # 从self.table中获取所有的'page'的值以site开头的访问量, page是这个表的主键
        response = self.table.scan(
            FilterExpression=Key('page').begins_with(origin) & Key('Counter').gt(0),
            Select='SPECIFIC_ATTRIBUTES',
            ProjectionExpression='#p, #c',
            ExpressionAttributeNames={'#p': 'page', '#c': 'Counter'}
        )
        return [_decimal_to_int(x) for x in response['Items']]

    def update_visitor_counter(self, page: str) -> dict:
        response = self.table.update_item(
            Key={"page": page, "cid": self.VC_CID},
            UpdateExpression="SET LastVisit = :t ADD #k :i",
            ExpressionAttributeNames={'#k': 'Counter'},
            ExpressionAttributeValues={':t': int(time.time()), ':i': 1},
            ReturnValues='UPDATED_OLD')
        resp = response.get('Attributes', self.VC_EMPTY)
        return _decimal_to_int(resp)

    def list_comments(self, page, offset=0, limit=10, **kwargs) -> List[dict]:
        offset = int(offset)
        limit = int(limit)
        if offset:
            kce = Key('page').eq(page) & Key('cid').between(0, offset)
        else:
            kce = Key('page').eq(page) & Key('cid').gt(0)
        response = self.table.query(
            KeyConditionExpression=(kce),
            Limit=limit,
            ScanIndexForward=False,
        )
        for it in response['Items']:
            it['cid'] = int(it['cid'])
            it['timestamp'] = int(it['timestamp'])
        return response['Items']

    def post_comments(self, page, nickname, comment, email=None, **kwargs) -> dict:
        resp = self.table.update_item(
            Key={'page': self.COMMENT_META_PAGE, 'cid': self.COMMENT_META_CID},
            UpdateExpression='ADD LastID :inc',
            ExpressionAttributeValues={':inc': 1},
            ReturnValues="UPDATED_NEW"
        )
        cid = resp['Attributes']['LastID']

        item = {
            "page": page,
            "cid": int(cid),
            "nickname": nickname,
            "comment": comment,
            "timestamp": int(time.time()),
        }
        if email:
            item["email"] = email
        self.table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(cid)",
        )
        return {'status': 'success'}
