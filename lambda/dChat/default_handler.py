import os
import json
import time
import boto3
from typing import Optional
from boto3.dynamodb.conditions import Key, Attr

YOUR_API_ID = os.environ.get('API_ID', 'YOUR_API_ID')
YOUR_REGION = os.environ.get('REGION', 'ap-northeast-1')
TABLE_NAME = os.environ.get('TABLE_NAME', 'dChat')
LIVETIME = int(os.environ.get('LIVETIME', '86400'))
ENDPOINT_URL = f'https://{YOUR_API_ID}.execute-api.{YOUR_REGION}.amazonaws.com/Prod'
ITEMLIMIT = 1000

class PublicObjects:
    _table = None
    _apigateway = None

    @property
    def table(self):
        if self._table is None:
            dynamodb = boto3.resource('dynamodb')
            self._table = dynamodb.Table(TABLE_NAME)
        return self._table

    @property
    def apigateway(self):
        if self._apigateway is None:
            self._apigateway = boto3.client('apigatewaymanagementapi', endpoint_url=ENDPOINT_URL)
        return self._apigateway

PO = PublicObjects()


def lambda_handler(event, context):
    route_key = event['requestContext']['routeKey']
    connection_id = event['requestContext']['connectionId']

    try:
        if route_key == '$connect':
            query_params = event['queryStringParameters']
            uuid = query_params['uuid']
            nickname = query_params.get('nickname', uuid[:4])
            page_path = query_params['page_path']
            room_id = query_params['room_id']
            position = query_params.get('position', 0)
            print(f"CALL handle_connect({connection_id}, {uuid}, {nickname}, {page_path}, {room_id}, {position})")
            response = handle_connect(connection_id, uuid, nickname, page_path, room_id, position)

        elif route_key == '$disconnect':
            print(f"CALL handle_disconnect({connection_id})")
            response = handle_disconnect(connection_id)

        elif route_key == '$default':
            body = json.loads(event['body'])
            action = body.get('action')
            page_path = body['page_path']
            room_id = body['room_id']
            if action == 'before_disconnect':
                print(f"CALL handle_before_disconnect({connection_id}, {page_path}, {room_id})")
                response = handle_before_disconnect(connection_id, page_path, room_id)
            elif action == 'full_data_request':
                print(f"CALL handle_full_data_request({connection_id}, {page_path}, {room_id})")
                response = handle_full_data_request(connection_id, page_path, room_id)
            else:
                message = body.get('message', '')
                print(f"CALL handle_default({connection_id}, {page_path}, {room_id}, {message}) {action=}")
                response = handle_default(connection_id, page_path, room_id, message)
    except Exception as e:
        response = {
            'statusCode': 400,
            'body': repr(e)
        }

    print(f"RESPONSE {response}")
    return response


def handle_connect(connection_id, uuid, nickname, page_path, room_id, position):
    table = PO.table
    pk = page_path
    sk = room_id

    if connection_limit():
        raise Exception('Max Connection Reached')

    response = table.query(
        KeyConditionExpression=Key('PK').eq(pk),
        Limit=1
    )
    
    if not response['Items']:
        return {
            'statusCode': 400,
            'body': 'Error: Invalid page_path'
        }   

    item, err = get_item(pk, sk)

    expiry = int(time.time()) + LIVETIME
    new_connect = {
        'ConnectionId': connection_id,
        'UUID': uuid,
        'Nickname': nickname,
        'Online': 1,
        'Position': int(position)
    }

    if not item:
        table.put_item(
            Item={
                'PK': pk,
                'SK': sk,
                'Connections': [new_connect],
                'Messages': [],
                'expiry': expiry
            }
        )
    else:
        message = {
            'type': 'join',
            'uuid': uuid,
            'nickname': nickname,
            'timestamp': int(time.time())
        }
        message_json = json.dumps(message)

        connections = item.get('Connections', [])
        kick_same_uuid(connections, uuid)
        for conn in connections:
            if conn['UUID'] == uuid:
                broadcast(item, message_json, saveMessage=False)
                conn['ConnectionId'] = connection_id
                conn['Online'] = 1
                table.update_item(
                    Key={'PK': pk, 'SK': sk},
                    UpdateExpression="SET Connections = :val1, expiry = :val2",
                    ExpressionAttributeValues={
                        ':val1': connections,
                        ':val2': expiry
                    }
                )
                break
        else:
            broadcast(item, message_json, saveMessage=False)
            table.update_item(
                Key={'PK': pk, 'SK': sk},
                UpdateExpression="SET Connections = list_append(Connections, :val1), expiry = :val2",
                ExpressionAttributeValues={
                    ':val1': [new_connect],
                    ':val2': expiry
                }
            )
            
    return {
        'statusCode': 200,
        'body': 'Connected successfully'
    }


def handle_disconnect(connection_id):
    return {
        'statusCode': 200,
        'body': 'Disconnected successfully'
    }


def handle_before_disconnect(connection_id, page_path, room_id):
    table = PO.table
    item, err = get_item(page_path, room_id)
    if err:
        return err
    
    connections = item.get('Connections', [])
    lost_connections = []
    for conn in connections:
        if conn['ConnectionId'] == connection_id:
            conn['Online'] = 0
            lost_connections = [conn]
            break

    if lost_connections:
        broadcast_disconnect(item, lost_connections)

    table.update_item(
        Key={'PK': page_path, 'SK': room_id},
        UpdateExpression="SET Connections = :val1",
        ExpressionAttributeValues={':val1': connections}
    )


def handle_full_data_request(connection_id, page_path, room_id):
    table = PO.table
    apigateway = PO.apigateway

    item, err = get_item(page_path, room_id)
    if err:
        return err
    
    # 获取在线用户列表
    connections = item.get('Connections', [])
    online_users = [
        {'uuid': conn['UUID'], 'nickname': conn['Nickname']}
        for conn in connections if conn.get('Online')
    ]
    
    # 获取最新的20条消息记录
    messages = item.get('Messages', [])[-20:]

    # 构造响应数据
    data = {
        'type': 'fullDataResponse',
        'users': online_users,
        'messages': messages
    }

    # 发送数据到客户端
    try:
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(data)
        )
        return {
            'statusCode': 200,
            'body': 'Full data sent successfully'
        }
    except Exception as e:
        print(f"Failed to send full data: {str(e)}")
        return {
            'statusCode': 500,
            'body': 'Error: Failed to send full data'
        }


def handle_default(connection_id, page_path, room_id, message):
    item, err = get_item(page_path, room_id)
    if err:
        return err
    
    connections = item.get('Connections', [])
    messages = item.get('Messages', [])
    
    connection_info = next((conn for conn in connections if conn['ConnectionId'] == connection_id), None)
    if not connection_info:
        return {
            'statusCode': 404,
            'body': 'Error: Connection Info not found'
        }
    new_message = {
        'type': 'text',
        'uuid': connection_info['UUID'],
        'nickname': connection_info['Nickname'],
        'message': message,
        'timestamp': int(time.time())
    }
    new_message_json = json.dumps(new_message)
    messages.append(new_message_json)
    broadcast(item, new_message_json)
    return {
        'statusCode': 200,
        'body': 'Message sent successfully'
    }


def get_item(pk, sk) -> tuple[Optional[dict], Optional[dict]]:
    response = PO.table.get_item(Key={'PK': pk, 'SK': sk})
    if 'Item' not in response:
        err = {
            'statusCode': 404,
            'body': 'Error: Item not found'
        }
        return None, err
    return response['Item'], None


def broadcast(item, message_json, saveMessage=True):
    apigateway = PO.apigateway
    table = PO.table
    expiry = int(time.time()) + LIVETIME
    keys = {'PK': item['PK'], 'SK': item['SK']}
    connections = item.get('Connections', [])

    lost_connections = []
    for conn in connections:
        if conn['Online']:
            try:
                apigateway.post_to_connection(
                    ConnectionId=conn['ConnectionId'],
                    Data=message_json
                )
            except apigateway.exceptions.GoneException:
                print(f"Connection {conn['ConnectionId']} is lost and removed.")
                lost_connections.append(conn)
                conn['Online'] = 0

    if lost_connections:
        broadcast_disconnect(item, lost_connections)
    
    if saveMessage:
        table.update_item(
            Key=keys,
            UpdateExpression="SET Connections = :val1, Messages = list_append(Messages, :val2), expiry = :val3",
            ExpressionAttributeValues={
                ':val1': connections,
                ':val2': [message_json],
                ':val3': expiry
            }
        )


def broadcast_disconnect(item, lost_connections):
    apigateway = PO.apigateway
    connections = item.get('Connections', [])

    lost_conn_uuids = [conn['UUID'] for conn in lost_connections]
    message = {
        'type': 'leave',
        'uuids': lost_conn_uuids,
        'timestamp': int(time.time())
    }
    message_json = json.dumps(message)
    for conn in connections:
        if conn['Online']:
            try:
                apigateway.post_to_connection(
                    ConnectionId=conn['ConnectionId'],
                    Data=message_json
                )
            except apigateway.exceptions.GoneException:
                print(f"Connection {conn['ConnectionId']} is lost.")


def kick_same_uuid(connections, uuid):
    apigateway = PO.apigateway
    to_kick = [conn for conn in connections if conn['UUID'] == uuid and conn['Online']]
    for conn in to_kick:
        try:
            apigateway.post_to_connection(
                ConnectionId=conn['ConnectionId'],
                Data=json.dumps({
                    'type': 'disconnect',
                    'reason': 'Duplicate UUID detected',
                })
            )
            apigateway.delete_connection(ConnectionId=conn['ConnectionId'])
            conn['Online'] = 0
        except Exception as e:
            print(f"Failed to disconnect {conn['ConnectionId']}: {str(e)}")


def connection_limit():
    client = boto3.client('dynamodb')
    response = client.describe_table(TableName=TABLE_NAME)
    item_count = response['Table']['ItemCount']
    return item_count > ITEMLIMIT
