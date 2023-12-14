import json
import os
import boto3
# from boto3.dynamodb.types import Decimal
# from boto3.dynamodb.conditions import Key

DB = boto3.resource('dynamodb')
TABLENAME = os.environ.get('TableName', 'd-comment')
METACID = int(os.environ.get('MetaCid', 1))

def lambda_handler(event, context):
    return EventHandler.dispatcher(event, context)

class DynamoDBHandler:
    META_PAGE = 'Metadata'
    META_CID = METACID
    CID_KEY = 'LastID'
    CID_MAX = 1000
    USERS_KEY = 'metadict'
    MSG_PAGE = 'dchat'
    MSG_KEY = 'comment'
    MSG_FROM = 'nickname'
    MSG_TIMESTAMP = 'timestamp'

    def __init__(self) -> None:
        self.table = DB.Table(TABLENAME)
        self.META_KEY = {'page': self.META_PAGE, 'cid': self.META_CID}

    def get_cid(self):
        table = self.table
        resp = table.update_item(
            Key=self.META_KEY,
            UpdateExpression=f'set {self.CID_KEY} = if_not_exists({self.CID_KEY}, :start) + :inc',
            ExpressionAttributeValues={
                ':start': 0,
                ':inc': 1
            },
            ReturnValues="UPDATED_NEW"
        )
        lastID = resp['Attributes'][self.CID_KEY]

        if lastID > self.CID_MAX:
            lastID = 0
            table.update_item(
                Key=self.META_KEY,
                UpdateExpression=f'set {self.CID_KEY} = :start',
                ExpressionAttributeValues={
                    ':start': 0
                }
            )
        return lastID

    def insert_user(self, username, connectionId):
        table = self.table
        table.update_item(
            Key=self.META_KEY,
            UpdateExpression=f'set {self.USERS_KEY}.{connectionId} = :val',
            ExpressionAttributeValues={
                ':val': username
            }
        )
        data = {'connectionId': connectionId}
        return {'statusCode': 200, 'body': json.stringify(data)}

    def delete_user(self, connectionId):
        table = self.table
        table.update_item(
            Key=self.META_KEY,
            UpdateExpression=f'remove {self.META_USERS}.{connectionId}'
        )
        return {'statusCode': 200, 'body': 'disconnect'}


class EventHandler(DynamoDBHandler):
    def __init__(self, event, context) -> None:
        self.event = event
        self.context = context

    @classmethod
    def dispatcher(cls, event, context):
        obj = cls(event, context)
        return obj.dispatch()

    def dispatch(self):
        event = self.event
        print('EVENT', event)
        requestContext = event['requestContext']
        routeKey = requestContext['routeKey']
        routeMap = {
            '$connect': self.connect_handler,
            '$disconnect': self.disconnect_handler,
            '$default': self.default_handler,
            'send': self.send_handler,
            'poll': self.poll_handler}
        route = routeMap.get(routeKey, None)
        if route:
            return route()
        else:
            return {'statusCode': 404, 'body': 'routeKey not found'}

    def connect_handler(self):
        # 向META_PAGE的META_USERS添加当前用户的connectionId，以字典形式添加{username: connectionId}
        requestContext = self.event['requestContext']
        connectionId = requestContext['connectionId']
        username = connectionId

    def disconnect_handler(self):
        # 从META_PAGE的META_USERS中删除当前用户的记录
        requestContext = self.event['requestContext']
        connectionId = requestContext['connectionId']
        username = connectionId

    
    def default_handler(self):
        return {'statusCode': 404, 'body': 'routeKey not supported'}
    
    def send_handler(self):
        requestContext = self.event['requestContext']
        connectionId = requestContext['connectionId']
        body = json.loads(self.event['body'])
        msg = body['msg']
        msgfrom = body.get('from', connectionId)
        timestamp = requestContext['requestTimeEpoch']

        cid = self.get_new_cid()
        table = db.Table(tableName)
        table.put_item(
            Item={
                'page': self.MSG_PAGE,
                'cid': cid,
                'comment': msg,
                'nickname': msgfrom,
                'timestamp': timestamp
            }
        )

        # 从db中获取所有的用户connectionId，然后向所有用户发送消息
        resp = table.query(
            KeyConditionExpression='page = :page',
            ExpressionAttributeValues={
                ':page': self.META_PAGE
            }
        )
        users = resp['Items'][0][self.META_USERS]
        data = {
            'msg': msg,
            'from': msgfrom,
            'timestamp': timestamp
        }
        self.callback(json.dumps(data), users.values())
    
    def poll_handler(self):
        return {'statusCode': 200, 'body': 'test'}

    def callback(self, data, connectionId: "str|list[str]|None" = None):
        requestContext = self.event['requestContext']
        domain = requestContext['domainName']
        stage = requestContext['stage']
        callback_url = f'https://{domain}/{stage}'
        client = boto3.client('apigatewaymanagementapi', endpoint_url=callback_url)

        if connectionId is None:
            connectionId = requestContext['connectionId']
        if isinstance(connectionId, str):
            connectionId = [connectionId]
        for cid in connectionId:
            request_params = {
                'ConnectionId': cid,
                'Data': data,
            }
            client.post_to_connection(**request_params)
