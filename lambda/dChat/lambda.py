# import os
# import boto3
# from boto3.dynamodb.types import Decimal
# from boto3.dynamodb.conditions import Key

# _DEFAULT_RESOURCE = boto3.resource('dynamodb')
# _DEFAULT_TABLENAME = os.environ.get('TableName', 'd-comment')



def lambda_handler(event, context):
    return echo_handler(event, context)


def echo_handler(event, context):
    print('EVENT', event)
    return {'statusCode': 200, 'body': 'hello'}
