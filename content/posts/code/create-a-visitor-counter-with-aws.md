---
title: "用AWS做一个免费的访客计数"
subtitle: ""
date: 2023-02-08T15:48:45+08:00
lastmod: 2023-02-08T15:48:45+08:00
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
library:
  css:
    # someCSS = "some.css" (for static/some.css) or "https://cdn.example.com/some.css"
  js:
    # someJS = "some.js" (for static/some.js) or "https://cdn.example.com/some.js"
seo:
  images: []
---

<!-- 正文 -->

### 创建DynamoDB


### 创建Lambda函数

``` python
import json, boto3, time

client = boto3.client('dynamodb')
TableName = 'visitor_counter'

def get_args(event):
    if 'body' in event:  # for HTTP request
        args = json.loads(event['body'])
    else:  # for test purpose
        args = event
    return args

def lambda_handler(event, context):
    args = get_args(event)
    print(dict(event))

    key = {'page': {'S': args.get('page')}}
    action = args.get('action')
    data = {}

    if action is None:
        return {'error': 'Missing key: action'}

    if action == 'get':
        resp = client.get_item(
            TableName=TableName,
            Key=key
        )

        data = {
            'last': resp['Item']['last_visit']['N'],
            'visit': resp['Item']['visit']['N'],
        }

    if action == 'update':
        now = int(time.time())
        resp = client.update_item(
            TableName=TableName,
            Key=key,
            UpdateExpression = 'SET last_visit = :time ADD visit :inc',
            ExpressionAttributeValues = {':inc' : {'N': '1'}, ':time': {'N': str(now)}},
            ReturnValues="UPDATED_OLD"
        )

        data = {
            'last': resp['Attributes']['last_visit']['N'],
            'visit': resp['Attributes']['visit']['N'] + 1,
        }

    return data
```

#### 手动向Lambda执行角色添加两个权限
```
Allow:dynamodb:GetItem
Allow:dynamodb:UpdateItem
```

#### 配置允许CROS源为自己的网站



### JS
在jupyter-notebook用测试代码测试一下
``` javascript
var xmlhttp = new XMLHttpRequest();
var url = "https://3jrymxtdceti2icc6r4mgqmpei0gzzls.lambda-url.ap-northeast-3.on.aws";
var data = {page: "www.example.com", action: "get"};

xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        // JSON.parse(this.responseText);
        element.text(this.responseText);
    }
};

xmlhttp.open("POST", url);
xmlhttp.send(JSON.stringify(data));
```

正式使用的代码
``` javascript
var url = "https://3jrymxtdceti2icc6r4mgqmpei0gzzls.lambda-url.ap-northeast-3.on.aws";
var target = "MyVisitorCounter";
function query() {
  
}
```

### HTML
``` HTML
<div class='MyVisitorCounter'>
    访问计数: <span name='visit'>xxx</span>
    上次访问: <span name='last'>xxxx-xx-xx</span>
</div>
```

### 代码段嵌入 Hugo
