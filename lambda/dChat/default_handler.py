import os
import json
import time
import boto3
from model import ConnectionInfo, MemberInfo, Message, DChatException

YOUR_API_ID = os.environ.get('API_ID', 'YOUR_API_ID')
YOUR_REGION = os.environ.get('REGION', 'ap-northeast-1')
TABLE_NAME = os.environ.get('TABLE_NAME', 'dChat')
LIVETIME = int(os.environ.get('LIVETIME', '86400'))
ITEMLIMIT = int(os.environ.get('ITEMLIMIT', '1000'))
ENDPOINT_URL = f'https://{YOUR_API_ID}.execute-api.{YOUR_REGION}.amazonaws.com/Prod'

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)
apigateway = boto3.client('apigatewaymanagementapi', endpoint_url=ENDPOINT_URL)

def lambda_handler(event, context):
    route_key = event['requestContext']['routeKey']
    connectionId = event['requestContext']['connectionId']    
    print(f'CALL {route_key=}')

    if route_key == '$connect':
        query_params = event['queryStringParameters']
        print(f'{query_params=}')
        response = handle_connect(connectionId, **query_params)

    elif route_key == '$disconnect':
        response = handle_disconnect(connectionId)

    elif route_key == '$default':
        body = json.loads(event['body'])
        action = body.get('action')
        print(f'{body=}')
        if action == 'reload':
            response = handle_reload(connectionId)
        else:
            text = body.get('text', body)
            response = handle_message(connectionId, text)

    print(f"RESPONSE {response}")
    return response


def handle_connect(connectionId, uuid, page_path, room_id, nickname=None, position=0, **kwargs):
    nickname = nickname if nickname else uuid[:4]
    expiry = int(time.time()) + LIVETIME 

    if get_item_count() > ITEMLIMIT:
        raise Exception('Max Connection Reached')

    new_connect = ConnectionInfo(
        connectionId,
        uuid,
        page_path,
        room_id,
        expiry=expiry,
    )
    new_member = MemberInfo(
        connectionId,
        uuid,
        nickname,
        1,
        position,
    )
    new_message = Message(
        'join',
        uuid,
        nickname,
    )

    room = get_room(page_path, room_id)
    table.put_item(Item=new_connect.asitem())
    join_room(room, new_member)
    broadcast(room, json.dumps(new_message.asdict()), saveMessage=False)

    return {
        'statusCode': 200,
        'body': 'Connected successfully'
    }


def handle_disconnect(connectionId):
    this_member = None
    connect = get_connection(connectionId)
    room = get_room(connect.page_path, connect.room_id)

    members = room.get('members', [])
    for mem in members:
        if mem['uuid'] == connect.uuid:
            this_member = mem
            mem['online'] = 0
            break

    table.update_item(
        Key={'PK': connect.page_path, 'SK': connect.room_id},
        UpdateExpression="SET members = :val1",
        ExpressionAttributeValues={':val1': members}
    )

    broadcast_disconnect(room, this_member)

    return {
        'statusCode': 200,
        'body': 'Disonnected successfully'
    }

def handle_reload(connectionId):
    connect = get_connection(connectionId)
    room = get_room(connect.page_path, connect.room_id)
    
    members = room.get('members', [])
    messages = room.get('messages', [])[-20:]
    for mem in members:
        mem.pop('connectionId', None)
        mem['online'] = int(mem['online'])
        mem['position'] = int(mem.get('position', 0))

    data = {
        'msgtype': 'reload',
        'members': members,
        'messages': messages
    }
    apigateway.post_to_connection(
        ConnectionId=connectionId,
        Data=json.dumps(data)
    )

    return {
        'statusCode': 200,
        'body': 'Full data sent successfully'
    }


def handle_message(connectionId, text):
    connect = get_connection(connectionId)
    room = get_room(connect.page_path, connect.room_id)
    member = get_member_by_uuid(room, connect.uuid)

    new_message = Message(
        'text',
        member.uuid,
        member.nickname,
        text,
    )
    broadcast(room, json.dumps(new_message.asdict()), saveMessage=True)

    return {
        'statusCode': 200,
        'body': 'Message sent successfully'
    }


def get_connection(connectionId):
    response = table.get_item(Key={'PK': 'connection', 'SK': connectionId})
    item = response.get('Item')
    if item is None:
        raise DChatException('Connection item not found')
    item.pop('PK')
    item['connectionId'] = item.pop('SK')
    return ConnectionInfo(**item)


def get_room(page_path, room_id):
    response = table.get_item(Key={'PK': page_path, 'SK': room_id})
    item = response.get('Item')
    if item is None:
        raise DChatException('Room item not found')
    return item


def get_item_count():
    client = boto3.client('dynamodb')
    response = client.describe_table(TableName=TABLE_NAME)
    item_count = response['Table']['ItemCount']
    return item_count


def get_member_by_uuid(room, uuid):
    m = next((mem for mem in room.get('members', []) if mem['uuid'] == uuid), None)
    return MemberInfo(**m)


def broadcast(room, message_json, saveMessage=False):
    expiry = int(time.time()) + LIVETIME
    keys = {'PK': room['PK'], 'SK': room['SK']}
    members = room.get('members', [])

    counter = 0
    lost_members = []
    for mem in members:
        if mem['online'] == 1:
            try:
                apigateway.post_to_connection(
                    ConnectionId=mem['connectionId'],
                    Data=message_json
                )
            except apigateway.exceptions.GoneException:
                print(f"Connection {mem['connectionId']} is lost and removed.")
                lost_members.append(mem)
                mem['online'] = 0

    expression_list = ['SET expiry = :val1']
    expression_value = {':val1': expiry}

    if lost_members:
        for member in lost_members:
            broadcast_disconnect(room, member)
        expression_list.append('members = :val2')
        expression_value[':val2'] = members

    if saveMessage:
        expression_list.append('messages = list_append(messages, :val3)')
        expression_value[':val3'] = [message_json]

    table.update_item(
        Key=keys,
        UpdateExpression=', '.join(expression_list),
        ExpressionAttributeValues=expression_value,
    )


def broadcast_disconnect(room, member_dict):
    member = MemberInfo(**member_dict)
    new_message = Message(
        'leave',
        member.uuid,
        member.nickname,
    )
    message_json = json.dumps(new_message.asdict())

    members = room.get('members', [])
    for mem in members:
        if mem['online'] == 1:
            try:
                apigateway.post_to_connection(
                    ConnectionId=mem['connectionId'],
                    Data=message_json
                )
            except apigateway.exceptions.GoneException as e:
                print(f"Failed to send message to connection {mem['connectionId']}: {e}")


def disconnect(connectionId, reason='Server closed socket'):
    try:
        apigateway.post_to_connection(
            ConnectionId=connectionId,
            Data=json.dumps({
                'type': 'disconnect',
                'reason': reason,
            })
        )
        apigateway.delete_connection(ConnectionId=connectionId)
    except Exception as e:
        print(f'Failed in disconnect {connectionId=} for {reason=}.\n{repr(e)}')


def join_room(room, member: MemberInfo):
    keys = {'PK': room['PK'], 'SK': room['SK']}
    expiry = int(time.time()) + LIVETIME 
    members = room.get('members', [])
    for mem in members:
        if mem['uuid'] == member.uuid:
            if mem['online']:
                disconnect(mem['connectionId'], 'Multiple login')
            mem['connectionId'] = member.connectionId
            mem['online'] = 1
            table.update_item(
                Key=keys,
                UpdateExpression="SET members = :val1, expiry = :val2",
                ExpressionAttributeValues={
                    ':val1': members,
                    ':val2': expiry
                }
            )
            break
    else:
        table.update_item(
            Key=keys,
            UpdateExpression="SET members = list_append(members, :val1), expiry = :val2",
            ExpressionAttributeValues={
                ':val1': [member.asdict()],
                ':val2': expiry
            }
        )
