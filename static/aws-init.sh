#!/bin/bash
BINURL='https://github.com/XTLS/Xray-core/releases/download/v1.7.5/Xray-linux-64.zip'
CONFIGURL='https://DarkGoldBar.github.io/aws-xray.json'
WD='/data'
XPORT=4567
XUUID='abcd1234-abcd-4321-dcba-12345678abcd'

yum install -y wget unzip screen
mkdir $WD $WD/xray $WD/log
wget "$BINURL" -O $WD/Xray-linux-64.zip
unzip $WD/Xray-linux-64.zip -d "$WD/xray"
wget "$CONFIGURL" -O $WD/xray-confing.json
sed -i -e "s/%PORT%/${XPORT}/" -e "s/%UUID%/${XUUID}/" $WD/xray-confing.json
screen -dmS proxy $WD/xray/xray -c $WD/xray-confing.json
