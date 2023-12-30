#!/bin/bash
if [ ! -d "./DynamoDBLocal" ]; then
    mkdir DynamoDBLocal
    cd DynamoDBLocal
    wget https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.tar.gz
    tar -xvzf dynamodb_local_latest.tar.gz
else
    cd DynamoDBLocal
fi

# jre >= 11.x
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
