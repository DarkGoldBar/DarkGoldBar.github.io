import json
import boto3
import os
import time

TABLE_NAME = os.environ.get('TABLE_NAME', 'dChat')
LIVETIME = int(os.environ.get('LIVETIME', '86400'))

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    method = event['requestContext']['http']['method']
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')
    try:
        if method == 'GET':
            return handle_get_request()

        elif method == 'POST':
            if action == 'createRoom':
                return handle_create_room(body)
            else:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'message': 'Invalid action'})
                }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal server error', 'error': str(e)})
        }

def handle_get_request():
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'GET request received'})
    }

def handle_create_room(body):
    page_path = body.get('page_path')
    room_id = body.get('room_id')
    expiry = int(time.time()) + LIVETIME 

    if not page_path or not room_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Missing page_path or room_id'})
        }

    item = {
        'PK': page_path,
        'SK': room_id,
        'messages': [],
        'members': [],
        'expiry': expiry,
    }

    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)"
        )
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Room already exists'})
        }

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Room created successfully', 'room_id': room_id, 'page_path': page_path})
    }
