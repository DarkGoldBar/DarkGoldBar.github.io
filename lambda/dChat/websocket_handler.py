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
BODYSIZELIMIT = int(os.environ.get('BODYSIZELIMIT', '10000'))
ENDPOINT_URL = f'https://{YOUR_API_ID}.execute-api.{YOUR_REGION}.amazonaws.com/Prod'

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)
apigateway = boto3.client('apigatewaymanagementapi', endpoint_url=ENDPOINT_URL)

def lambda_handler(event, context):
    route_key = event['requestContext']['routeKey']
    connectionId = event['requestContext']['connectionId']    
    print(f'CALL {connectionId=} {route_key=}')

    if route_key == '$connect':
        query_params = event['queryStringParameters']
        print(f'{query_params=}')
        response = handle_connect(connectionId, **query_params)

    elif route_key == '$disconnect':
        response = handle_disconnect(connectionId)

    elif route_key == '$default':
        assert len(event['body']) < BODYSIZELIMIT
        body = json.loads(event['body'])
        action = body.get('action')
        print(f'{body=}')
        if action == 'reload':
            response = handle_reload(connectionId)
        elif action == 'anqi-reset':
            response = handle_anqi_reset(connectionId)
        elif action == 'anqi-dog':
            response = handle_anqi_dog(connectionId)
        elif action == 'anqi-move':
            response = handle_anqi_move(connectionId, body)
        else:
            text = body.get('text', body)
            response = handle_message(connectionId, text)

    print(f"RESPONSE {response}")
    if response['statusCode'] >= 400:
        data = {
            'msgtype': 'warning',
            'message': response['body']
        }
        apigateway.post_to_connection(
            ConnectionId=connectionId,
            Data=json.dumps(data)
        )
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
        online=True,
        position=position,
    )
    new_message = {
        'msgtype': 'join',
        'uuid': uuid,
        'nickname': nickname,
        'position': position,
    }

    room = get_room(page_path, room_id)
    table.put_item(Item=new_connect.asitem())
    join_room(room, new_member)
    broadcast(room, json.dumps(new_message), saveMessage=False, skip_uuid=new_connect.uuid)

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
            mem['online'] = False
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


def broadcast(room, message_json, saveMessage=False, skip_uuid=None):
    expiry = int(time.time()) + LIVETIME
    keys = {'PK': room['PK'], 'SK': room['SK']}
    members = room.get('members', [])

    lost_members = []
    for mem in members:
        if (mem['online']) and (mem['uuid'] != skip_uuid):
            try:
                apigateway.post_to_connection(
                    ConnectionId=mem['connectionId'],
                    Data=message_json
                )
            except apigateway.exceptions.GoneException:
                print(f"Connection {mem['connectionId']} is lost and removed.")
                lost_members.append(mem)
                mem['online'] = False

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
        if mem['online']:
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
            mem['online'] = True
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


#######
# 暗棋 #
#######

def handle_anqi_reset(connectionId):
    connect = get_connection(connectionId)
    room = get_room(connect.page_path, connect.room_id)
    keys = {'PK': room['PK'], 'SK': room['SK']}

    gamestate = {    
        'board': generate_initial_board(),
        'turn_position': 1,
        'gameover': 0,
        'cols': 4,
        'last_move': [-1, -1],
        'left_color': 'none',
        'right_color': 'none',
        'left_eat': [],
        'right_eat': [],
        'can_dog': False,
    }

    new_message = {
        'msgtype': 'anqi-update',
        'gamestate': gamestate,
    }
    broadcast(room, json.dumps(new_message), saveMessage=False)

    expiry = int(time.time()) + LIVETIME
    table.update_item(
        Key=keys,
        UpdateExpression="SET messages = :val1, expiry = :expiry",
        ExpressionAttributeValues={
            ':val1': [json.dumps(gamestate)],
            ':expiry': expiry
        }
    )

    return {
        'statusCode': 200,
        'body': 'Board reset successfully'
    }


def handle_anqi_dog(connectionId):
    connect = get_connection(connectionId)
    room = get_room(connect.page_path, connect.room_id)
    keys = {'PK': room['PK'], 'SK': room['SK']}

    if len(room['messages']) < 2:
        return {'statusCode': 403, 'body': '无法悔棋'}

    gamestate = json.loads(room['messages'][0])
    if not gamestate['can_dog']:
        return {'statusCode': 403, 'body': '无法悔棋'}

    gamestate = json.loads(room['messages'][1])
    gamestate['can_dog'] = False

    new_message = {
        'msgtype': 'anqi-update',
        'gamestate': gamestate,
    }
    broadcast(room, json.dumps(new_message), saveMessage=False)
    table.update_item(
        Key=keys,
        UpdateExpression="SET messages[0] = :val1",
        ExpressionAttributeValues={
            ':val1': json.dumps(gamestate),
        }
    )
    return {
        'statusCode': 200,
        'body': 'Board undo successfully'
    }

def handle_anqi_move(connectionId, body):
    connect = get_connection(connectionId)
    room = get_room(connect.page_path, connect.room_id)
    member = get_member_by_uuid(room, connect.uuid)
    keys = {'PK': room['PK'], 'SK': room['SK']}

    gamestate = json.loads(room['messages'][0])
    turn_position = gamestate['turn_position']
    start_pos, end_pos = body['move']

    if int(member.position) != turn_position:
        return {'statusCode': 403, 'body': '不是你的回合'}

    if gamestate['gameover']:
        return {'statusCode': 403, 'body': '游戏已结束'}

    move_result = process_move(gamestate, start_pos, end_pos)
    if not move_result['valid']:
        return {'statusCode': 403, 'body': move_result.get('reason', '移动错误')}

    if gamestate['left_color'] == 'none':
        gamestate['left_color'] = 'red' if (gamestate['board'][start_pos][0] < 7) else 'black'
        gamestate['right_color'] = 'black' if (gamestate['left_color'] == 'red') else 'red'
    if start_pos != end_pos:
        eat_key = 'left' if (turn_position == 1) else 'right'
        if move_result['eat'][0] > -1:
            gamestate[eat_key].append(move_result['eat'])
            gamestate[eat_key][-1][1] = 1
    gamestate['can_dog'] = True
    gamestate['last_move'] = [start_pos, end_pos]
    gamestate['turn_position'] = 3 - turn_position
    if is_gameover(gamestate['board']):
        gamestate['gameover'] = 1

    new_message = {
        'msgtype': 'anqi-update',
        'gamestate': gamestate,
    }
    broadcast(room, json.dumps(new_message), saveMessage=False)
    expiry = int(time.time()) + LIVETIME
    table.update_item(
        Key=keys,
        UpdateExpression="SET messages[0] = :val1, messages[1] = :val2, expiry = :expiry",
        ExpressionAttributeValues={
            ':val1': json.dumps(gamestate),
            ':val2': room['messages'][0],
            ':expiry': expiry
        }
    )

    return {
        'statusCode': 200,
        'body': 'Turn move processed'
    }


def process_move(gamestate, start_pos, end_pos):
    """处理移动逻辑
    Args:
        gamestate = {    
            'board': generate_initial_board(),
            'turn_position': 1,
            'gameover': 0,
        }

        message = [1, 15] # 移动&吃
        message = [4, 4]  # 翻开棋子
    Return:
        is_valid_move
    """
    board = gamestate['board']
    cols = gamestate['cols']

    if not (0 <= start_pos < 32 and 0 <= end_pos < 32):
        return {'valid': False, 'reason': '位置超出范围'}
    
    if (start_pos // cols != end_pos // cols) and (start_pos % cols != end_pos % cols):
        return {'valid': False, 'reason': '不合理的移动'}

    if start_pos == end_pos:
        board[start_pos][1] = 1
        return {'valid': True}

    sp, sf = board[start_pos]  # start_piece, start_fliped
    if (sp == -1) or (sf == 0):
        return {'valid': False, 'reason': '起点没有棋子或棋子未翻开'}

    ep, ef = board[end_pos]  # end_piece, end_fliped
    if is_pao(sp):
        if ((start_pos - end_pos) in [1, -1, cols, -cols]) and (ef != -1):
            return {'valid': False, 'reason': '不合理的移动'}
    else:
        if (start_pos - end_pos) not in [1, -1, cols, -cols]:
            return {'valid': False, 'reason': '不合理的移动'}
        if ef == 0:
            return {'valid': False, 'reason': '不能移动到未翻开的位置'}
        if ef > 0:
            if not ((sp < 7) ^ (ep < 7)):
                return {'valid': False, 'reason': '不能吃掉自己棋子'}
            if not can_capture(sp, ep):
                return {'valid': False, 'reason': '不能吃掉终点位置的棋子'}

    eat, board[end_pos], board[start_pos] = board[end_pos], board[start_pos], [-1, -1]
    return {'valid': True, 'eat': eat}

def generate_initial_board():
    import random
    piece_to_number = ['帅', '仕', '相', '马', '车', '炮', '兵', '将', '士', '象', '马', '车', '炮', '卒']
    initial_board = [
        [0, 0], [1, 0], [1, 0], [2, 0], [2, 0], [3, 0], [3, 0], [4, 0],
        [4, 0], [5, 0], [5, 0], [6, 0], [6, 0], [6, 0], [6, 0], [6, 0],
        [7, 0], [8, 0], [8, 0], [9, 0], [9, 0], [10, 0], [10, 0], [11, 0],
        [11, 0], [12, 0], [12, 0], [13, 0], [13, 0], [13, 0], [13, 0], [13, 0]
    ]
    random.shuffle(initial_board)
    return initial_board

def is_pao(piece):
    return (piece % 7) == 5

def is_gameover(board):
    red_count = sum((p // 7 == 0) for p, f in board)
    black_count = sum((p // 7 == 1) for p, f in board)
    return red_count == 0 or black_count == 0

def can_capture(start_piece, end_piece):
    p1 = 7 - start_piece % 7
    p2 = 7 - end_piece % 7
    if (p1 == 1) and (p2 == 7):
        return True
    return p1 >= p2
