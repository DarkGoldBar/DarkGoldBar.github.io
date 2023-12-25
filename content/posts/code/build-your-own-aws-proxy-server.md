---
title: "建立自己的AWS代理服务器"
subtitle: "Build Your Own Aws Proxy Server"
date: 2023-11-14T14:36:46+08:00
lastmod: 2023-11-14T14:36:46+08:00
draft: false
author: ""
authorLink: ""
description: ""
license: ""
images: []
keywords:
  - aws
  - ec2
  - xray
  - 代理服务器

tags: ['aws', 'xray']
categories: ['代码笔记']

featuredImage: '/images/code/vmess_aws.png'
featuredImagePreview: '/images/code/vmess_aws.png'

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
share:
  enable: true
comment:
  enable: true
seo:
  images: []
---
<!-- 正文 -->
为了个人使用代理方便，写了一个简单的aws-ec2的启动、查询、销毁网页工具。[简易代理服务管理器]({{< ref "posts/tools/server_launcher.md" >}})  
这个工具里的隐私信息使用了本地的cookie做持久化，不需要每次输入。里面的4项配置的构造方法没有说明，这次就写一个说明教程。

<!--more-->

需要准备的东西：
- AWS国际账号

---
## 1. AK/SK

{{< admonition example "" true>}}
- AK = AKIAXFxxxxxx
- SK = xxxxxxxxxxxxxxxxxxxx
{{< /admonition >}}

在自动化操作的时候，我们通常使用AK/SK方式。根据这篇官方文档的描述，强烈建议不要创建根用户访问密钥对。因此我们需要先创建一个具有EC2权限的普通用户，然后给这个用户创建一个AKSK用来进行后面的操作。  
https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/id_root-user_manage_add-key.html  

### 创建用户

https://console.aws.amazon.com/iam/home#/users  

创建用户的步骤二时，给用户添加虚拟机的完全控制权限。  
1. 权限选项 -> 直接附加策略  
2. 权限策略 -> 搜索"EC2Full" -> 勾选 "AmazonEC2FullAccess"

第三步查看和创建的例子，确认没有问题即可创建用户。  
{{< image src="/images/code/sl01.png" caption="创建用户检查">}}

### 生成秘钥
点刚才创建的用户名，在用户控制界面，点创建访问密钥。  
1. "访问密钥最佳实践和替代方案"时，随便选一个，或者直接选其他
2. "描述标签值"，随便写，没有实际用途。
3. 生成秘钥之后保存好SK的值，它只会在这里显示一次。

{{< image src="/images/code/sl02.png" caption="生成秘钥">}}



---
## 2. 选择实例类型/区域 (InstanceType)
{{< admonition example "" true>}}
- Region       = ap-northeast-1
- InstanceType = t3a.nano
{{< /admonition >}}

---
EC2的价格/区域表 https://aws.amazon.com/cn/ec2/pricing/on-demand/  

区域建议选择东京、新加坡，这两个地方有大陆出发的海底光缆直达，不需要信号中继，延迟相对较低。
而且AWS在这两个地方的机房比较大，会有新的便宜机器。
像是香港、雅加达就没有t3a的机器，t3a用的AMD的CPU，价格比t3更便宜。
定期重新看定价表是很有必要的，AWS基本上每年都会更新机器类型，比如我一开始用的c5，后来发现t2更便宜，然后现在又改成t3。
但是要注意不要选择带"g"的机器，比如t4g，用的是AWS自研ARM芯片，指令集不一样，不能执行对x86编译的二进制程序。
  
这里我就选择在东京使用最划算的t3a.nano机器，只要0.0061刀/小时。

选定区域之后，就要点控制台右上角的改区了。不同区域的子网、安全组、秘钥对是不互通的，所以要确保后面的操作都在同一个区域。
修改地区的菜单在控制台右上角。

控制台 https://console.aws.amazon.com/ec2/  

---
## 3. EC2容器配置

{{< admonition example "" true>}}
- ImageId = ami-035322b237ca6d47a
- KeyName = mykey1
- Groups  =  sg-012dc6909c278654d
{{< /admonition >}}

### 镜像号 (ImageId)
镜像列表 https://console.aws.amazon.com/ec2/home?#AMICatalog

镜像，不做过多介绍了。
这里就选列表第一个 Amazon Linux 2023 AMI (64-bit (x86))，今天的最新版本镜像号是`ami-035322b237ca6d47a`，这个号码随着镜像更新会变化，但是一两年内用同一个也没什么问题。

{{< image src="/images/code/sl03.png" caption="镜像选择">}}

---
### SSH秘钥对 (KeyName)
秘钥对控制台 https://console.aws.amazon.com/ec2/home?#KeyPairs

秘钥对，用来ssh远程登录服务器，仅在配置出错时排查问题使用，正确配置的情况下并不需要ssh。
以默认选项创建密钥对即可，记住这个密钥对的名字，后面要用这个名字来填写启动参数。这里我们密钥对就是`mykey1`

{{< image src="/images/code/sl05.png" caption="秘钥对">}}


---
### 安全组 (Groups)
安全组控制台 https://console.aws.amazon.com/ec2/home?#SecurityGroups

安全组，机器的端口开关配置。点新建安全组，默认配置是关闭全部入站和打开全部出站。
这里我们需要把ssh端口和代理端口的入站打开。
代理端口就自己随便填一个，和后面的代理配置写成一样的即可，建议在2000-9999之间。

{{< image src="/images/code/sl06.png" caption="安全组">}}


创建完成后，在安全组控制台找到刚才新建的安全组ID，以'sg-'开头。

---
## 4. 容器初始化脚本 (UserData)

{{< admonition example "" true>}}
- UserData = IyEvYmluL2Jhc2gKWFJBWVBPUlQ9NTY3OApYUkFZVVVJRD1iMTkwYjZmZi0wZ...
{{< /admonition >}}

接下来制作启动脚本，这个初始化脚本会以root身份使用screen命令在后台启动一个xray进程。配置中只有一个inbound，使用vmess协议，端口和UUID为用户在脚本中指定的值。对vmess协议不熟悉的话需要先学习一下projectV中对入站协议的教程。  
我的脚本模版贴在下面，稍微改动即可。  
1. 把 `XRAYPORT` 的值5678改成在安全组中设置的端口号
2. 把 `XRAYUUID` 的值改成一个自己生成的新的UUID
3. 把改好的脚本转码为base64

### UUID生成按钮
{{< raw >}}
<button onclick="document.getElementById('myuuid').innerText=crypto.randomUUID();">点击生成UUID</button> <span id='myuuid'></span>
{{< /raw >}}

### 启动脚本
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

### base64转码器
{{< raw >}}
<div style="display: flex;">
  <textarea id="stringInput" placeholder="原始字符串"></textarea>
  <div style="display: inline-flex; flex-direction: column;margin: 10px;">
    <button onclick="document.getElementById('base64Input').value = btoa(document.getElementById('stringInput').value)">→</button>
    <button onclick="document.getElementById('stringInput').value = atob(document.getElementById('base64Input').value)">←</button> 
  </div>
  <textarea id="base64Input" placeholder="base64字符串"></textarea>
</div>
{{< /raw >}}


## 5. 完成启动设置
最后，把我们上边的配置写到下面的json里对应的项目上，就得到了最终的ec2启动配置。  
将得到的ec2启动配置和AK/SK/region填进代理服务管理器即可开机

{{< admonition warning "" true>}}
`Name: MyXrayServer` 是重要的标签，在代理服务管理器中，将只会显示满足`tag:Name='MyXrayServer*'`条件过滤的服务器。
{{< /admonition >}}

``` json
{
  "MaxCount": 1,
  "MinCount": 1,
  "ImageId": "ami-035322b237ca6d47a",
  "InstanceType": "t3a.nano",
  "KeyName": "mykey1",
  "UserData": "IyEvYmluL2Jhc.....",
  "NetworkInterfaces": [
    {
      "DeviceIndex": 0,
      "AssociatePublicIpAddress": true,
      "Groups": ["sg-012dc6909c278654d"]
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
  ],
}
```
