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

