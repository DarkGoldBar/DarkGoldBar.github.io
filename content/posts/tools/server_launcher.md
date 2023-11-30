---
title: "EC2服务器管理工具"
subtitle: ""
date: 2023-08-01T11:10:00+08:00
lastmod: 2023-08-01T11:10:00+08:00
draft: false
author: ""
authorLink: ""
description: "EC2服务器管理工具"
license: ""
images: []

tags: []
categories: ['工具']

featuredImage: ""
featuredImagePreview: ""

hiddenFromHomePage: false
hiddenFromSearch: false
twemoji: false
lightgallery: false
ruby: false
fraction: false
fontawesome: false
linkToMarkdown: false
rssFullText: false

toc:
  enable: false
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
  js:
    ray: '<script src="/js/ray.3.js"></script>'
    aws-js-sdk: 'https://sdk.amazonaws.com/js/aws-sdk-2.933.0.min.js'
seo:
  images: []
---
<!--more-->
<!-- 正文 -->
管理满足`tag:Name='MyXrayServer*'`条件的服务器。

- Config: 服务器启动设置，json格式
- Start: 启动一个服务器
- Query: 查询服务器
- Save secrets: 把配置数据保存到本地Cookie，下次打开网页自动载入
- Terminate: 关闭指定服务器

{{< server_launcher >}}

