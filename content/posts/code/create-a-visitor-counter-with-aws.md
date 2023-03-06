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

介绍如何在在自己的静态网站中从头制作一个访客计数器，最后插入到Hugo模板中，使每个博客页面都获得计数功能。
<!--more-->

## 结构设计
{{< image src="/images/code/vc005.png" title="流程图" width="450">}}
1. 用户访问静态站点(Gitpage)
2. 静态站点服务返回预渲染页面和JS脚本
3. 计数统计的脚本向AWS Lambda发送计数请求
4. Lambda收到请求后，发起数据库请求
5. 数据库返回结果到Lambda
6. Lambda把结果返回给用户。最后页面JS收到计数结果，渲染到网页上。

在这个流程中，DynamoDB提供了数据存储的功能，负责存储每个页面的地址和访问量。
但是数据库的访问需要用户验证以及特定的接口。因此为了处理匿名用户的HTTP请求，添加了一个Lambda函数做中转。

{{< admonition tip "Tip" true >}}
这里用到的Lambda服务和DynamoDB服务，在个人小用量的情况下都是能免费使用的。
具体额度可以在AWS官网上查到
[aws计算&数据库免费额度](https://aws.amazon.com/cn/free/?nc2=h_ql_pr_ft&all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all)
{{< /admonition >}}

-----------------------------------------------

## 数据库
在AWS控制台找到DynamoDB页面，简单创建一个新表，起个名字，表的主键设置为字符串型数据page，排序键不需要，其他都按默认设置即可。  

{{< image src="/images/code/vc001.png" caption="创建表">}}

我们希望每个页面作为表的一行数据，url作为主键，保存访问量以及最后访问时间。  
手动添加一行样例数据，这个网页版添加数据的操作很不友好，所以截图说明一下应该写成这个样子。
添加完成后可以在 *表* -> *浏览项目* 里确认自己的数据已经写入数据表

{{< image src="/images/code/vc002.png" caption="添加样例行">}}


## Lambda
在AWS控制台找到Lambda页面，创建一个新函数，使用Python语言，架构选arm64更便宜，执行角色暂且选基本权限。在高级设置里选启用URL，不需要授权，开启CORS。具体如图

{{< image src="/images/code/vc006.png" caption="Lambda设置1">}}
{{< image src="/images/code/vc007.png" caption="Lambda设置2">}}

### 修改Lambda权限
```
Allow:dynamodb:GetItem
Allow:dynamodb:UpdateItem
```

### 修改CROS限制


### 代码
{{< highlight python "linenos=table">}}
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
    EMPTY_RESP = {
        'last_visit': {'N': 0},
        'visit': {'N': 0},
    }
    print('RECIVE', dict(event))
    args = get_args(event)

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
        
        d = resp.get('Item', EMPTY_RESP)
        data = {
            'last': d['last_visit']['N'],
            'visit': d['visit']['N'],
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

        d = resp.get('Attributes', EMPTY_RESP)
        data = {
            'last': d['last_visit']['N'],
            'visit': str(int(d['visit']['N']) + 1),
        }

    print('SEND', data)
    return data
{{< /highlight >}}

### 测试

用浏览器控制台测试一下aws-lambda是否正常工作
``` javascript
var xmlhttp = new XMLHttpRequest();
var url = "https://3jrymxtdceti2icc6r4mgqmpei0gzzls.lambda-url.ap-northeast-3.on.aws";
var data = {page: "www.example.com", action: "get"};

xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        console.log(this.responseText);
    }
};

xmlhttp.open("POST", url);
xmlhttp.send(JSON.stringify(data));
```

## Hugo模板中插入代码片段

### 创建partial模板
新建一个partial模板，路径为`/layouts/partials/my_vc.html`  
简单写两行，内容都交给脚本
``` HTML
<div id="visitCount"></div>
<script src="/js/visit_counter.js"></script>
```

### 插入posts模板

找到需要插入访问计数的模板文件，我这里是使用了Loveit模板，路径为`themes/LoveIt/layouts/posts/single.html`，把这个文件复制到`layouts/posts/single.html`，然后在模板文件里找到合适的地方，
插入代码片段`{{- partial "my_vc.html" . -}}`，我这里是插入到了正文目录的前面。

### JS代码
根据partial模板中写的脚本对应的目录就是`/static/js/visit_counter.js`
{{< admonition tip "Tip" true >}}
`vcSite`改为你的域名  
`vcServer`改为你的函数URL
{{< /admonition >}}

{{< highlight javascript "linenos=table">}}
var CurrentPage=window.location.origin + window.location.pathname;
var vcSite="https://darkgoldbar.github.io";
var vcServer="https://xxxxxxxx.lambda-url.ap-northeast-3.on.aws/";
var vcResponse=null;

window.addEventListener('load', vcOnLoad);

function vcOnLoad() {
    if (window.location.origin == vcSite){
        if (vcCheck()) {
            vcRequest('get');
        } else {
            vcRequest('update');
        }
    }
}

function vcRequest(action) {
    let data = {page: CurrentPage, action: action};
    let xmlhttp = new XMLHttpRequest();
    let resp_data = null;

    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            resp_data = JSON.parse(this.responseText);
            vcRender(resp_data);
        } else if (this.readyState == 4 && this.status != 200) {
            console.log('visit counter API failed');
            vcResponse = this;
        }
    };

    xmlhttp.open("POST", vcServer);
    xmlhttp.send(JSON.stringify(data));
}

function vcCheck(){
    let visited = false;
    let cookie_key = 'last_visit:' + CurrentPage;
    let currentTimeStamp = new Date().getTime();
    let lastTimeStamp = new Number(localStorage.getItem(cookie_key));
    if (lastTimeStamp && ((currentTimeStamp - lastTimeStamp) < 24 * 60 * 60 * 1000)) {
        visited = true;
    }
    localStorage.setItem(cookie_key, currentTimeStamp);
    return visited
}

function vcRender(data) {
    // data = {last:"1675853136", visit:"6"}
    let vcnode = document.getElementById('visitCount');
    let d = new Date();
    d.setTime(Number(data.last + "000"));
    vcnode.innerHTML = '浏览次数: <span>' +data.visit+ '</span> 最后访问: <span>' +d.toISOString()+ '</span>'
}
{{< /highlight >}}
