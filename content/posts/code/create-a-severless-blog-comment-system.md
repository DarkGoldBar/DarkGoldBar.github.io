---
title: "制作一个无服务器博客评论系统"
subtitle: "手搓的，就是最好的"
date: 2023-03-17T20:45:00+08:00
lastmod: 2023-03-17T20:45:00+08:00
draft: true
author: ""
authorLink: ""
description: ""
license: ""
images: []

tags: ['javascript', 'Python', 'hugo']
categories: ['代码笔记']

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
seo:
  images: []
---

## 前言

做完访客计数之后，就在调研哪个博客评论系统好用。
先看了一遍LoveIt模板的支持列表，海外的服务的主要问题是禁止访问和访问速度很慢。
注意到Valine是用的国内的LeanCloud，尝试注册了一下，居然找我要身份证+支付宝验证，直接给我吓跑了。
看来还是得靠自己，继续用 AWS Lambda + DynamoDB 做一个自己的评论系统。

<!--more-->

## 【一】设计

### 数据库设计
DynamoDB是AWS提供的NoSQL数据库服务，其数据模型与关系型数据库有很大不同。其中，DynamoDB的数据是按照分区键（Partition Key）进行分区存储，分区键是一个唯一标识符，用来将数据分布在不同的物理分区中。在每个分区内，数据根据排序键（Sort Key）排序存储。在查询时，会对分区键进行哈希查询，对排序键进行二分查询。
|键|类型|功能|
|---|---|---|
|page| **分区键** 字符串 | 评论所属的页面地址 |
|cid| **排序键** 数字 | 评论的编号，*自增*，以后可以用于回复转发 |
|timestamp| 数字 | 发帖时间，服务端填写 |
|nickname| 字符串 | 发帖人的名字，必填字段，任意填写 |
|email| 字符串 | 发帖人的邮箱，选填字段，仅作前端格式检查 |
|comment| 字符串 | 评论内容纯文本 |

但是，DynamoDB中并没有自增键的功能，需要自己实现一个自增功能。因此增加一条名为Metadata的记录储存一个属性LastID，从1000开始，每次在增加评论前让LastID+1，新的LastID值作为新评论的cid。
|page|cid|LastID|
|---|---|---|
|"Metadata"| 0 | 1000 |

可以看到评论的数据库的分区键和访客计数都用的页面地址，也是为了节省成本，这两个功能可以做在同一张表里。对于访客统计可以对每一个page用一条记录来存储，cid设为-1，LastVisit和Counter记录最后访问时间戳和访问次数。
|page|cid|LastVisit|Counter|
|---|---|---|---|
| *page* | -1 | 1679058053 | 1 |

{{< image src="/images/code/dcom1.png" title="数据库设计">}}


### 前端设计
HTML发帖表单就照着数据库设计的做。发表评论的form用三个input元素负责nickname、email、comment这三个用户输入的部分，再加一个提交按钮，然后用CSS美化一下。这部分我实际上是交给chatGPT写的。一行分割线之后就是评论展示区域，展示出来的评论除了名字邮箱和正文之外再加上一个发帖时间。为了一些需要获得评论id的逻辑，还要把cid写在元素DOM里。

展示评论的
