---
title: "建立自己的AWS代理服务器"
subtitle: "Build Your Own Aws Proxy Server"
date: 2023-11-14T14:36:46+08:00
lastmod: 2023-11-14T14:36:46+08:00
draft: true
author: ""
authorLink: ""
description: ""
license: ""
images: []

tags: []
categories: []

featuredImage: ""
featuredImagePreview: ""

hiddenFromHomePage: false
hiddenFromSearch: false
twemoji: false
lightgallery: true
ruby: true
fraction: true
fontawesome: true
linkToMarkdown: true
rssFullText: false

toc:
  enable: true
  auto: true
code:
  copy: true
  maxShownLines: 50
math:
  enable: false
mapbox:
share:
  enable: true
comment:
  enable: true
library:
  css:
    # someCSS = "some.css" (for static/some.css) or "https://cdn.example.com/some.css"
  js:
    # someJS = "some.js" (for static/some.js) or "https://cdn.example.com/some.js"
seo:
  images: []
---

为了自己平时使用代理方便，写了一个简单的aws开机关机查询页面。  
隐私信息都用本地的cookie做了持久化，不需要每次输入。  
但是各个配置的填写没有说明，这次就写一个说明文档兼教程。  
<!--more-->
{{< ref "posts/tools/server_launcher.md" >}}
<!-- 正文 -->


## 1. AK/SK/区域
https://console.aws.amazon.com/iam/home#/users


## 2. 实例类型 (InstanceType)
https://aws.amazon.com/ec2/instance-types/


## 3. 镜像AMI (ImageId)
https://console.aws.amazon.com/ec2/home?#AMICatalog:


## 4. SSH秘钥 (KeyName)
https://console.aws.amazon.com/ec2/home?#KeyPairs:


## 5. 安全组 (Groups)
https://console.aws.amazon.com/ec2/home?#SecurityGroups:


## 6. 初始化脚本 (UserData)
```bash
#!/bin/bash
BINURL='https://github.com/XTLS/Xray-core/releases/download/v1.7.5/Xray-linux-64.zip'
CONFIGURL='https://DarkGoldBar.github.io/aws-xray.json'
WD='/data'
XPORT=8000
XUUID=b190b6ff-0d35-47d0-b644-7ff52f05db33

yum install -y wget unzip screen
mkdir $WD $WD/xray $WD/log
wget "$BINURL" -O $WD/Xray-linux-64.zip
unzip $WD/Xray-linux-64.zip -d "$WD/xray"
wget "$CONFIGURL" -O $WD/xray-confing.json
screen -dmS proxy $WD/xray/xray -c $WD/xray-confing.json

```

```JS
const xuuid = crypto.randomUUID(); 
const xport = Math.round(Math.random() * 8000 + 2000);
alert(`uuid: ${xuuid}\nport: ${xport}`);
```
