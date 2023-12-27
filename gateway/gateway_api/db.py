import os

import boto3


TABLENAME = os.environ.get('TableName', 'd-comment')

db = boto3.client('dynamodb', endpoint_url='http://localhost:8000')


class DynamoClient:
    @staticmethod
    def create_table():
        """
            hash key: {type: str, name: page}}
            range key: {type: int, name: cid}}
        """
        resp = db.list_tables()
        if TABLENAME in resp['TableNames']:
            print(f'{TABLENAME} already exists')
            return
        db.create_table(
            TableName=TABLENAME,
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
