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
<!-- 正文 -->
为了自己平时使用代理方便，写了一个简单的aws开机关机查询页面。  
隐私信息都用本地的cookie做了持久化，不需要每次输入。  
但是各个配置的填写没有说明，这次就写一个说明文档兼教程。  

先上链接:
简易代理启动器 {{< ref "posts/tools/server_launcher.md" >}}

需要准备的东西：
- AWS国际账号

<!--more-->

## AK/SK
在自动化操作的时候，我们通常使用AK/SK方式。根据这篇官方文档的描述，强烈建议不要创建根用户访问密钥对。因此我们需要先创建一个具有EC2权限的普通用户，然后给这个用户创建一个AKSK用来进行后面的操作。  
https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/id_root-user_manage_add-key.html  

### 创建用户

https://console.aws.amazon.com/iam/home#/users  

创建用户的步骤二时，给用户添加虚拟机的完全控制权限。  
1. 权限选项 -> 直接附加策略  
2. 权限策略 -> 搜索"EC2Full" -> 勾选 "AmazonEC2FullAccess"

第三步查看和创建的例子，确认没有问题即可创建用户。  
![创建用户检查](images/sl01.png)

### 生成秘钥
点刚才创建的用户名，在用户控制界面，点创建访问密钥。  
1. "访问密钥最佳实践和替代方案"时，随便选一个，或者直接选其他
2. "描述标签值"，随便写，没有实际用途。
3. 生成秘钥之后保存好SK的值，它只会在这里显示一次。

![生成秘钥](images/sl02.png)

## 实例类型/区域 (InstanceType)
EC2的价格/区域表 https://aws.amazon.com/cn/ec2/pricing/on-demand/  

区域建议选择东京、新加坡，这两个地方有大陆出发的海底光缆直达，不需要信号中继，延迟相对较低。
而且AWS在这两个地方的机房比较大，会有新的便宜机器。
像是香港、雅加达就没有t3a的机器，t3a用的AMD的CPU，价格比t3更便宜。
定期重新看定价表是很有必要的，AWS基本上每年都会更新机器类型，比如我一开始用的c5，后来发现t2更便宜，然后现在又改成t3。
但是要注意不要选择带"g"的机器，比如t4g，用的是AWS自研ARM芯片，指令集不一样，不能执行对x86编译的二进制程序。
  
这里我就选择在东京使用最划算的t3a.nano机器，只要0.0061刀/小时。
```yaml
Region: ap-northeast-1
InstanceType: t3a.nano
```

选定区域之后，就要点控制台右上角的改区了。不同区域的子网、安全组、秘钥对是不互通的，所以要确保后面的操作都在同一个区域。  
控制台 https://console.aws.amazon.com/ec2/  
![改区域](images/sl04.png)

## 镜像号 (ImageId)
镜像列表 https://console.aws.amazon.com/ec2/home?#AMICatalog

镜像，不做过多介绍了。
这里就选列表第一个 Amazon Linux 2023 AMI (64-bit (x86))，今天的最新版本镜像号是`ami-035322b237ca6d47a`，这个号码随着镜像更新会变化，但是一两年内用同一个也没什么问题。

![镜像选择](images/sl03.png)

```yaml
ImageId: ami-035322b237ca6d47a
```

## SSH秘钥 (KeyName)
秘钥对控制台 https://console.aws.amazon.com/ec2/home?#KeyPairs

秘钥对，用来ssh远程登录服务器，仅在配置出错时排查问题使用，正确配置的情况下并不需要ssh。  
以默认选项创建密钥对即可，记住这个密钥对的名字，后面要用这个名字来填写启动参数。

![秘钥对](images/sl05.png)

```yaml
KeyName: mykey1
```


## 安全组 (Groups)
安全组控制台 https://console.aws.amazon.com/ec2/home?#SecurityGroups

安全组，机器的端口开关配置。点新建安全组，默认配置是关闭全部入站和打开全部出站。
这里我们需要把ssh端口和代理端口的入站打开。
代理端口就自己随便填一个，和后面的代理配置写成一样的即可，建议在2000-9999之间。

![安全组](images/sl06.png)

创建完成后，在安全组控制台找到刚才新建的安全组ID，以'sg-'开头。

```yaml
Groups: sg-012dc6909c278654d
```

## 初始化脚本 (UserData)
接下来制作启动脚本，我的脚本模版贴在下面。稍微改动即可，然后把这个改好的脚本转码为base64即可。
- 把 `XRAYPORT` 的值5678改成在安全组中设置的端口号
- 把 `XRAYUUID` 的值改成一个自己生成的新的UUID
- <button onclick='alert(crypto.randomUUID());'>生成UUID</button>

```bash
#!/bin/bash
XRAYPORT=5678
XRAYUUID=b190b6ff-0d35-47d0-b644-7ff52f05db33
XRAYJSON='https://DarkGoldBar.github.io/aws-xray.json'
XRAYZIP='https://github.com/XTLS/Xray-core/releases/download/v1.7.5/Xray-linux-64.zip'
WD='/xray'

yum install -y wget curl unzip screen
mkdir $WD
wget $XRAYZIP -O $WD/Xray.zip
curl $XRAYJSON | sed -e "s/%PORT%/$XRAYPORT/" -e "s/%UUID%/$XRAYUUID/" > $WD/config.json
unzip $WD/Xray.zip -d $WD/bin
screen -dmS xray $WD/bin/xray -c $WD/config.json
```
