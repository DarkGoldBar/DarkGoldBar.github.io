import os
import boto3
from datetime import datetime, timedelta

# Variables
INTERVAL = int(os.environ.get('INTERVAL', '30'))
TAGNAME = os.environ.get('TAGNAME', 'MyXrayServer*')

# 帮我写一个def lambda_handler(event, context)函数
def lambda_handler(event, context):
    ec2 = boto3.resource('ec2')
    cloudwatch = boto3.client('cloudwatch')

    # 查询状态为running的ec2实例，过滤出tag:Name=MyXrayServer的实例，将他们的instanceID保存到列表。
    instances = ec2.instances.filter(
        Filters=[
            {'Name': 'instance-state-name', 'Values': ['running']},
            {'Name': 'tag:Name', 'Values': [TAGNAME]}
        ]
    )
    instance_ids = [instance.id for instance in instances]

    terminated = []

    # 遍历这个instanceID列表，查询他们近半个小时在CloudMetric中的NetworkOut的最大值
    for instance_id in instance_ids:
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='NetworkOut',
            Dimensions=[
                {
                    'Name': 'InstanceId',
                    'Value': instance_id
                },
            ],
            StartTime=datetime.now() - timedelta(minutes=INTERVAL),
            EndTime=datetime.now(),
            Period=300,
            Statistics=[
                'Maximum',
            ],
            Unit='Bytes'
        )

        # 对于近半个小时NetworkOut小于1MB的的实例，执行终止实例
        datapoints = response.get('Datapoints', [])
        if len(datapoints) > 1:
            max_network_out = max(x['Maximum'] for x in datapoints)
            if max_network_out < 1e6:
                ec2.instances.filter(InstanceIds=[instance_id]).terminate()
                terminated.append(instance_id)

    if terminated:
        print('Instance terminated: ' + ','.join(terminated))
    else:
        raise Exception('No instance to terminate.')

# 执行这个函数的lambda执行者角色需要哪些权限，帮我写出权限描述文件
