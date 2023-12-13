import os
import boto3
import json
import base64

# Variables
TAGNAME = os.environ.get('TAGNAME', 'MyXrayServer*')
XRAYPORT = os.environ.get('XRAYPORT', '80')
XRAYID = os.environ.get('XRAYID', '')

VMESSDATA = {
    'v': '2',
    'ps': 'UNKNOWN',
    'add': '0.0.0.0',
    'port': '80',
    'id': '00000000-0000-0000-0000-000000000000',
    'aid': '0',
    'net': 'tcp',
    'scy': 'auto',
    'alpn': '',
    'fp': '',
    'host': '',
    'path': '',
    'sni': '',
    'tls': '',
    'type': 'none',
}

EC2_STATE_MAP = {
    'running': '运行中',
    'terminated': '已终止',
    'stopped': '已停止',
    'stopping': '正在停止',
    'pending': '正在启动',
}

def json_base64_encode(data):
    return base64.b64encode(json.dumps(data).encode()).decode()


def set_ps(state, iid):
    return EC2_STATE_MAP.get(state, state) + ' ' + iid


def lambda_handler(event, context):
    ec2 = boto3.resource('ec2')

    assert XRAYID
    # 查询状态为running的ec2实例，过滤出tag:Name=MyXrayServer的实例
    instances = ec2.instances.filter(
        Filters=[
            {'Name': 'instance-state-name'},
            {'Name': 'tag:Name', 'Values': [TAGNAME]}
        ]
    )

    # https://github.com/2dust/v2rayN/wiki/%E5%88%86%E4%BA%AB%E9%93%BE%E6%8E%A5%E6%A0%BC%E5%BC%8F%E8%AF%B4%E6%98%8E(ver-2)
    vmess_list = []
    for instance in instances:
        vmess = VMESSDATA.copy()
        vmess['ps'] = set_ps(instance.state['Name'], instance.id)
        vmess['add'] = instance.public_ip_address
        vmess['id'] = XRAYID
        vmess_link = 'vmess://' + json_base64_encode(vmess)
        vmess_list.append(vmess_link)

    return json_base64_encode(vmess_list)
