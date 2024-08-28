---
title: "自伸缩AWS代理服务器"
subtitle: "Auto Scaling Aws Proxy Server"
date: 2024-08-05T12:00:00+08:00
lastmod: 2024-08-05T12:00:00+08:00
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
Xray服务器，每月仅1美元！！

<!--more-->
## 架构图

{{< image src="images/code/V2Ray-on-AWS-UML.png" caption="架构图">}}

可用性：95%
- 有可能正好给实例分配了一个被ban掉的IP，导致服务无法使用，且不会开启新实例。这个时候只能使用那个手搓的控制台再开一个实例，然后关掉被ban的实例。

成本：约1$/月
- 基于个人用量统计。

## 功能流程
1. V2Ray客户端订阅地址设定为lambda函数的调用地址。
2. V2Ray客户端点更新订阅。
2.1 无运行中的实例时，返回无效地址0.0.0.0:80，服务器名为“正在启动实例”。
2.2 有运行中的实例时，返回所有可用实例IP和地址。
3. V2Ray正常使用
4. 每小时启动监视lambda，检测每个服务器实例的使用量，关闭小于阈值的实例。

## 代码实现

代码实现并不复杂，其中监控函数几乎全是用GPT写的。参数都写在环境变量中了。
实现中真正麻烦的是AWS中的角色权限设置，目前我还在学习CloudFormation的用法，争取搞个一键部署出来。

- lambda1：订阅函数
代码地址：https://github.com/DarkGoldBar/DarkGoldBar.github.io/tree/main/lambda/xray-sub

- lambda2：监控函数
代码地址：https://github.com/DarkGoldBar/DarkGoldBar.github.io/tree/main/lambda/xray-watch

