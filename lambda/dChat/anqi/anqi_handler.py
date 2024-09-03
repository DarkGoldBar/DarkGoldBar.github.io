import os
import json
import time
import boto3
import random
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
    # route_key = 'anqi'
    # route_key = event['requestContext']['routeKey']
    connection_id = event['requestContext']['connectionId']

    try:
        body = json.loads(event['body'])
        action = body.get('action')
        page_path = body['page_path']
        room_id = body['room_id']
        print(f"HANDLE {connection_id} {body=}")
        if action == 'before_disconnect':
            response = handle_before_disconnect(connection_id, page_path, room_id)
        elif action == 'full_data_request':
            response = handle_full_data_request(connection_id, page_path, room_id)
        elif action == 'move':
            message = body.get('message', '')
            response = handle_move(connection_id, page_path, room_id, message)
        elif action == 'reset':
            response = handle_reset(connection_id, page_path, room_id)
        else:
            response = {
                'statusCode': 404,
                'body': "Unknown action"
            }
    except Exception as e:
        response = {
            'statusCode': 400,
            'body': repr(e)
        }

    print(f"RESPONSE {response}")
    return response


def handle_move(connection_id, page_path, room_id, message):
    table = PO.table
    apigateway = PO.apigateway
    item, err = get_item(page_path, room_id)
    if err:
        return err

    # 从数据库中获取游戏状态和连接信息
    connections = item['Connections']
    game_state = json.loads(item['Messages'][0])
    connection_info = next((conn for conn in connections if conn['ConnectionId'] == connection_id), None)

    # 获取当前玩家的位置和当前轮到的位置
    player_position = connection_info['Position']
    turn_position = game_state['turn_position']

    # 检查是否轮到当前玩家
    if player_position != turn_position:
        return {
            'statusCode': 403,
            'body': 'Not your turn'
        }
    
    move_result = process_move(game_state, message)
    game_state['turn_position'] = 3 - turn_position
    if is_gameover():
        game_state['gameover'] = 1

    if move_result['valid']:
        # 向客户端广播新的棋盘状态
        message = {
            'type': 'move',
            'game_state': game_state,
        }
        broadcast(item, message, saveMessage=False)

        # 更新到数据库
        expiry = int(time.time()) + LIVETIME
        table.update_item(
            Key={
                'PK': page_path,
                'SK': room_id
            },
            UpdateExpression="SET Messages = :val1, expiry = :expiry",
            ExpressionAttributeValues={
                ':val1': [json.dumps(game_state)],
                ':expiry': expiry
            }
        )
    else:
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({
                'type': 'invalid move',
                'reason': move_result['reason'],
            })
        )

    return {
        'statusCode': 200,
        'body': json.dumps(game_state)
    }

def process_move(game_state, message):
    """处理移动逻辑
    Args:
        game_state = {    
            'board': generate_initial_board(),
            'turn_position': 1,
            'gameover': 0,
        }

        message = [1, 15] # 移动&吃
        message = [4, 4]  # 翻开棋子
    Return:
        is_valid_move
    """
    board = game_state['board']
    turn_position = game_state['turn_position']
    gameover = game_state['gameover']

    if gameover:
        return {'valid': False, 'reason': '游戏已结束'}

    if not message or len(message) != 2:
        return {'valid': False, 'reason': '移动格式无效'}

    start_pos, end_pos = message

    if not (0 <= start_pos < 32 and 0 <= end_pos < 32):
        return {'valid': False, 'reason': '位置超出范围'}

    if start_pos == end_pos:
        board[start_pos][1] = 1
        return {'valid': True}

    sp, sf = board[start_pos]  # start_piece, start_fliped
    if (sp == -1) or (sf == 0):
        return {'valid': False, 'reason': '起点没有棋子或棋子未翻开'}

    if not is_own(sp, turn_position):
        return {'valid': False, 'reason': '起点不是自己的棋子'}

    ep, ef = board[end_pos]  # end_piece, end_fliped
    if is_pao(sp):
        if (start_pos // 8 != end_pos // 8) and (start_pos % 8 != end_pos % 8):
            return {'valid': False, 'reason': '不合理的移动'}
        if ((start_pos - end_pos) in [1, -1, 8, -8]) and (ef != -1):
            return {'valid': False, 'reason': '不合理的移动'}
    else:
        if (start_pos - end_pos) not in [1, -1, 8, -8]:
            return {'valid': False, 'reason': '不合理的移动'}
        if ef == 0:
            return {'valid': False, 'reason': '不能移动到未翻开的位置，除非是炮'}
        if ef > 0:
            if is_own(ep, turn_position):
                return {'valid': False, 'reason': '不能移动到被自己棋子占据的位置'}
            if not can_capture(sp, ep):
                return {'valid': False, 'reason': '不能吃掉终点位置的棋子'}

    board[end_pos] = board[start_pos]
    board[start_pos] = [-1, -1]
    return {'valid': True}

def can_capture(start_piece, end_piece):
    """
    将士相车马炮卒, 不处理炮
    """
    p1 = 7 - start_piece % 7
    p2 = 7 - end_piece % 7
    if (p1 == 1) and (p2 == 7):
        return True
    return p1 >= p2


def handle_reset(page_path, room_id):
    table = PO.table
    item, err = get_item(page_path, room_id)
    if err:
        return err

    # 初始化棋盘，每个棋子用一个数字表示种类，初始状态为未翻开
    game_state = {    
        'board': generate_initial_board(),
        'turn_position': 1,
        'gameover': 0,
    }

    # 向客户端广播新的棋盘状态
    message = {
        'type': 'reset',
        'game_state': game_state,
    }
    broadcast(item, message, saveMessage=False)

    # 更新到数据库
    expiry = int(time.time()) + LIVETIME
    table.update_item(
        Key={
            'PK': page_path,
            'SK': room_id
        },
        UpdateExpression="SET Messages = :val1, expiry = :expiry",
        ExpressionAttributeValues={
            ':val1': [json.dumps(game_state)],
            ':expiry': expiry
        }
    )

    return {
        'statusCode': 200,
        'body': 'Board reset successfully'
    }


def handle_full_data_request(connection_id, page_path, room_id):
    table = PO.table
    apigateway = PO.apigateway

    item, err = get_item(page_path, room_id)
    if err:
        return err
    
    # 获取在线用户列表
    connections = item.get('Connections', [])
    online_users = [
        {'uuid': conn['UUID'], 'nickname': conn['Nickname'], 'positon': conn['Position']}
        for conn in connections if conn.get('Online')
    ]
    
    # 获取最新的消息记录，暗棋只有一条消息。
    messages = item.get('Messages', [])

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



def generate_initial_board():
    # 数字到棋子的汉字映射
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

def is_own(piece, turn_position):
    return (piece // 7) == (turn_position - 1)

def is_gameover(board):
    red_count = sum((p // 7 == 0) for p, f in board)
    black_count = sum((p // 7 == 1) for p, f in board)
    return red_count == 0 or black_count == 0