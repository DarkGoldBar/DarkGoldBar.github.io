import os
import time
import boto3
from boto3.dynamodb.conditions import Key
from .models import VisitCount, Comment

TABLENAME = os.environ.get('TABLENAME', 'd-comment')
ENDPOINT_URL = os.environ.get('ENDPOINT_URL', None)


class DynamoClient():
    _db = None

    @classmethod
    def getdb(cls):
        if cls._db is None:
            cls._db = boto3.resource('dynamodb', endpoint_url=ENDPOINT_URL)
        return cls._db


class DynamoOperationFailed(Exception):
    pass


class DynamoOperation:
    VC_CID = 1
    COMMENT_LAST_CID = 2
    COMMENT_CID_MIN = 1000
    COMMENT_CID_MAX = 9999
    def __init__(self, table_name: str = TABLENAME):

        self.table_name = table_name
        self.table = DynamoClient.getdb().Table(table_name)

    def vc_get(self, page: str):
        resp = self.table.get_item(
            Key={"page": page, "cid": self.VC_CID}
        )
        if 'Item' in resp:
            return VisitCount(page=page, **resp['Item'])
        else:
            return VisitCount(page=page)

    def vc_update(self, page: str):
        timestamp = int(time.time())
        resp = self.table.update_item(
            Key={"page": page, "cid": self.VC_CID},
            UpdateExpression="SET #ts = :t ADD #cnt :inc",
            ExpressionAttributeNames={"#ts": "timestamp", "#cnt": "count"},
            ExpressionAttributeValues={':t': timestamp, ':inc': 1},
            ReturnValues='UPDATED_OLD')
        return VisitCount(page=page, **resp['Attributes'])

    def vc_scan(self, site: str):
        resp = self.table.scan(
            FilterExpression=Key('page').begins_with(site) & Key('count').gt(0),
            Select='SPECIFIC_ATTRIBUTES',
            ProjectionExpression='#p, #c',
            ExpressionAttributeNames={'#p': 'page', '#c': 'count'}
        )
        items = [VisitCount(page=item['page'], count=item['count']) for item in resp['Items']]
        items.sort(key=lambda x: x.count, reverse=True)
        return items

    def comment_get(self, page: str, offset: int = 0, limit: int = 10):
        resp = self.table.query(
            KeyConditionExpression='page = :p AND cid > :o',
            ExpressionAttributeValues={
                ':p': page,
                ':o': offset + self.COMMENT_CID_MIN
            },
            Limit=limit,
            ScanIndexForward=False
        )
        items = [Comment(**item) for item in resp.get('Items', [])]
        return items

    def comment_new(self, page: str, comment: Comment):
        resp = self.table.update_item(
            Key={'page': page, 'cid': self.COMMENT_LAST_CID},
            UpdateExpression='SET last_id = if_not_exists(last_id, :start) + :inc',
            ExpressionAttributeValues={':start': self.COMMENT_CID_MIN, ':inc': 1},
            ReturnValues="UPDATED_NEW"
        )
        cid = resp['Attributes']['last_id']
        if cid > self.COMMENT_CID_MAX:
            raise DynamoOperationFailed('too many comments')
        item = comment.dict()
        item.update(
            page=page,
            cid=cid,
            timestamp=int(time.time())
        )
        self.table.put_item(Item=item)
        return


def create_table(table_name: str = TABLENAME):
    """
        hash key: {type: str, name: page}}
        range key: {type: int, name: cid}}
    """
    resp = db.list_tables()
    if table_name in resp['TableNames']:
        print(f'{table_name} already exists')
        return
    db.create_table(
        TableName=table_name,
        KeySchema=[
            {
                'AttributeName': 'page',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'cid',
                'KeyType': 'RANGE'
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'page',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'cid',
                'AttributeType': 'N'
            }
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
