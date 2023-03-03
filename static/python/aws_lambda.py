import json, boto3, time

client = boto3.client('dynamodb')
TableName = 'visitor_counter'

def get_args(event):
    if 'body' in event:  # for HTTP request
        args = json.loads(event['body'])
    else:  # for test purpose
        args = event
    return args

def lambda_handler(event, context):
    EMPTY_RESP = {
        'last_visit': {'N': 0},
        'visit': {'N': 0},
    }
    print('RECIVE', dict(event))
    args = get_args(event)

    key = {'page': {'S': args.get('page')}}
    action = args.get('action')
    data = {}

    if action is None:
        return {'error': 'Missing key: action'}

    if action == 'get':
        resp = client.get_item(
            TableName=TableName,
            Key=key
        )
        
        d = resp.get('Item', EMPTY_RESP)
        data = {
            'last': d['last_visit']['N'],
            'visit': d['visit']['N'],
        }

    if action == 'update':
        now = int(time.time())
        resp = client.update_item(
            TableName=TableName,
            Key=key,
            UpdateExpression = 'SET last_visit = :time ADD visit :inc',
            ExpressionAttributeValues = {':inc' : {'N': '1'}, ':time': {'N': str(now)}},
            ReturnValues="UPDATED_OLD"
        )

        d = resp.get('Attributes', EMPTY_RESP)
        data = {
            'last': d['last_visit']['N'],
            'visit': str(int(d['visit']['N']) + 1),
        }

    print('SEND', data)
    return data
