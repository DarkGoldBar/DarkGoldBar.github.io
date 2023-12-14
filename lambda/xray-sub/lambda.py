import os
import boto3
import json
import base64

TAGNAME = os.environ.get('TAGNAME', 'MyXrayServer*')
XRAYPORT = os.environ.get('XRAYPORT', '80')
XRAYID = os.environ.get('XRAYID', '00000000-0000-0000-0000-000000000000')

USERDATA_TEMPLATE = """#!/bin/bash
XRAYPORT={0}
XRAYUUID={1}
XRAYJSON='https://DarkGoldBar.github.io/aws-xray.json'
XRAYZIP='https://github.com/XTLS/Xray-core/releases/download/v1.7.5/Xray-linux-64.zip'
WD='/xray'
yum install -y wget curl unzip screen
mkdir $WD
wget $XRAYZIP -O $WD/Xray.zip
curl $XRAYJSON | sed -e "s/%PORT%/$XRAYPORT/" -e "s/%UUID%/$XRAYUUID/" > $WD/config.json
unzip $WD/Xray.zip -d $WD/bin
screen -dmS xray $WD/bin/xray -c $WD/config.json
"""

SERVERCONFIG = {
  "MaxCount": 1,
  "MinCount": 1,
  "ImageId": "ami-035322b237ca6d47a",
  "InstanceType": "t3.nano",
  "KeyName": "AWS-NE3",
  "UserData": "",
  "NetworkInterfaces": [
    {
      "DeviceIndex": 0,
      "AssociatePublicIpAddress": True,
      "Groups": ["sg-076afbc37cb00a8aa"]
    }
  ],
  "TagSpecifications": [
    {
      "ResourceType": "instance",
      "Tags": [
        {
          "Key": "Name",
          "Value": "MyXrayServer"
        }
      ]
    }
  ]
}

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

def base64_encode(string:str):
    return base64.b64encode(string.encode()).decode()


def set_ps(state, iid):
    return EC2_STATE_MAP.get(state, state) + ' ' + iid


def create_server():
    ec2 = boto3.client('ec2')
    UserData = USERDATA_TEMPLATE.format(XRAYPORT, XRAYID)
    SERVERCONFIG['UserData'] = base64.b64encode(UserData.encode())
    response = ec2.run_instances(**SERVERCONFIG)
    print('CREATE ' + str(response))


def auth(headers: dict) -> bool:
    return 'v2ray' in headers.get('user-agent', '')


def lambda_handler(event, context):
    print('RECIVE ' + str(event))
    if not auth(event.get('headers', {})):
        return {"statusCode": 401}
    ec2 = boto3.resource('ec2')
    assert XRAYID

    instances = ec2.instances.filter(Filters=[{'Name': 'tag:Name', 'Values': [TAGNAME]}])
    if not [i for i in instances if i.state['Name'] != 'terminated']:
        create_server()

    # https://github.com/2dust/v2rayN/wiki/%E5%88%86%E4%BA%AB%E9%93%BE%E6%8E%A5%E6%A0%BC%E5%BC%8F%E8%AF%B4%E6%98%8E(ver-2)
    vmess_list = []
    vmess_link_list = []
    for instance in instances:
        vmess = VMESSDATA.copy()
        vmess['ps'] = set_ps(instance.state['Name'], instance.id)
        vmess['add'] = instance.public_ip_address
        vmess['port'] = XRAYPORT
        vmess['id'] = XRAYID
        vmess_list = [vmess]
        vmess_link = 'vmess://' + base64_encode(json.dumps(vmess))
        vmess_link_list.append(vmess_link)

    response = base64_encode('\n'.join(vmess_link_list))
    print('SEND ' + str(vmess_list))
    return response
