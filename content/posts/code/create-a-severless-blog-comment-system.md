---
title: "制作一个无服务器博客评论系统"
subtitle: "手搓的，就是最好的"
date: 2023-03-19T14:02:00+08:00
lastmod: 2023-03-19T14:02:00+08:00
draft: false
author: ""
authorLink: ""
description: "无服务器博客评论系统制作教程，使用aws-lambda + dynamodb作后端"
license: ""
images: []
keywords:
  - 博客
  - 评论系统
  - aws-lambda
  - aws-dynamodb
  - serverless

tags: ['javascript', 'python', 'hugo', 'aws']
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
看来还是得靠自己，这里我选择用 AWS Lambda + DynamoDB 做一个自己的评论系统。

<!--more-->

## 设计
{{< admonition tip >}}
*先设计好再动手* ----沃·兹基硕德
{{< /admonition >}}


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

最后，添加一些样例数据，可以得到这样一张数据表

{{< image src="/images/code/dcom1.png" title="数据库设计" width="100%">}}


### 前端设计
HTML发帖表单就照着数据库设计的做。发表评论的form用三个input元素负责nickname、email、comment这三个用户输入的部分，再加一个提交按钮，然后用CSS美化一下。这部分我实际上是交给chatGPT写的。一行分割线之后就是评论展示区域，展示出来的评论除了名字邮箱和正文之外再加上一个发帖时间。为了一些需要获得评论id的逻辑，还要把cid写在元素DOM里。

展示评论的逻辑构想上是在打开页面的时候，展示10条评论，下滑加载更多评论。但是这里我还没有做下滑加载的功能，暂时是点按钮加载更多。

{{< image src="/images/code/dcom2.png" title="前端样式" width="100%">}}

在这个简单的前端，我们需要实现这几个功能
1. 提交评论表单
2. 展示评论列表
3. 获取访客统计数据
4. 更新访客统计数据


## 实现
完成设计之后，就可以开始动手实现了。这里我假设已经有可正常使用的AWS账号，为了方便起见我的操作都是在用邮箱登录的根账号上进行的。

### Lambda函数

lambda函数对接JS和数据库。简单创建空函数，部署代码。  
`DComment`数据库类实现了4个操作：
- `DComment.get_visitor_counter`函数查询页面的访客数据
- `DComment.update_visitor_counter`函数查询页面的访客数据，并更新数据
- `DComment.list_comments`函数查询页面的评论列表切片，由于cid=-1是访客数据，所以查询时要求key>0
- `DComment.post_comments`函数在插入新评论前，先更新Metadata获得新的cid，然后在插入时判断当前cid是否存在，如果存在则插入失败

详细代码在博客代码仓库里。

### Lambda函数配置

代码部署之后，需要做一些配置调整：
1. 设置Lambda函数的环境变量，`TableName`设为自己创建的数据表的名字，代码中表的名字从环境变量读取
2. 调整函数权限，为执行角色添加DynamoDB的`PutItem,GetItem,Query,UpdateItem`的权限，可以在可视化权限编辑器里操作
3. 设置CORS允许标头，页面路径通过 headers `x-referer-page` 传递
4. 设置CORS允许源为自己的主页，我这里是`https://darkgoldbar.github.io`，
5. 设置CORS允许方法为`GET & POST`

设置完成的样子
{{< image src="/images/code/dcom3.png" width="100%">}}
{{< image src="/images/code/dcom4.png" width="100%">}}
{{< image src="/images/code/dcom5.png" width="100%">}}

### Javascript

完成了后端的数据库和lambda的部署之后，接下里就是写一个简单的前端了。
这里我用尽量简单的HTML和原生JS实现一个计数和评论的展示和交互。
同时为了在博客模板中插入的代码尽量简洁，选择用JS把内容插入空元素。
最终在博客模板中插入的HTML代码是这个样子的：

{{< highlight HTML>}}
<!-- 访客计数 -->
<div id="d-counter"></div>
<!-- 评论 -->
<div id="d-comment"></div>
<link rel="stylesheet" href="/css/comment.css" type="text/css">
<script src="/js/comment.2.2.js"></script>
{{< /highlight>}}

JS代码做了这几个函数：
- `dcomPage`: 获取当前页面路径。
- `dcomSite`: 存储站点地址，用于前端判断是否需要请求计数和评论。
- `dcomServer`: 存储dcom的API地址。
- `dcomInit`: 在页面加载完毕后，初始化评论区域，包括填充HTML、绑定事件等。
- `dcomVCRender`: 渲染浏览量计数器，接受计数和时间戳参数，将它们插入DOM中。
- `dcomRenderComment`: 渲染单条评论，接受评论信息，将其转化为HTML字符串。
- `dcomRenderCommentList`: 渲染评论列表，接受评论列表和“没有更多评论”的标记，将其转化为HTML字符串并插入DOM中。
- `dcomGetMore`: 加载更多评论，查询页面中所有评论的data-cid值，找到最小值作为下一个偏移量，并调用dcomGet函数获取更多评论。
- `dcomGet`: 获取评论，接受偏移量和限制数量，向dcomServer发起GET请求，获取评论列表，然后调用dcomRenderCommentList函数渲染评论列表。
- `dcomPost`: 提交评论，获取表单信息，将其转换为JSON格式，然后向dcomServer发起POST请求，提交评论，如果需要刷新评论列表，还会再次调用dcomGet获取最新评论列表。
- `dcomVC`: 访客计数，调用Cookie存储页面访问标记，根据上次访问时间和当前时间调用dcomVCRequest。
- `dcomVCRequest`: 向dcomServer发起GET请求，根据“doUpdate”标记确定是否更新访客数。

详细代码在博客代码仓库里。

## 部署

这里就用我使用的LoveIt模板举例。
Hugo在读取主题之前优先读取根目录下的模板，因此把我们需要改造的文件复制到根目录下更改，不需要更改主题文件。

这里先找到模板的`posts/single.html`模板文件，确认一下接下来需要把访客计数和评论分别添加到什么地方。  
发现访客计数是做了模块化处理，因此只需新建一个`partials/comment.html`模板，把自己的评论的CSS、JS还有带ID的空元素写进去即可，然后把CSS和JS文件放在static里。
```
{{- /* Comment */ -}}
{{- partial "comment.html" . -}}
```

但是，原模板没有做模块化的访客计数，只是把一个valine访客计数写死在模板里。
这里就需要在`posts/single.html`文件里找到访客计数的合适的地方，把我们的访客计数的空元素加进去。
{{< highlight HTML "hl_lines=13, linenostart=51">}}
<div class="post-meta-line">
    {{- with .Site.Params.dateformat | default "2006-01-02" | .PublishDate.Format -}}
        <i class="far fa-calendar-alt fa-fw" aria-hidden="true"></i>&nbsp;<time datetime="{{ . }}">{{ . }}</time>&nbsp;
    {{- end -}}
    <i class="fas fa-pencil-alt fa-fw" aria-hidden="true"></i>&nbsp;{{ T "wordCount" .WordCount }}&nbsp;
    <i class="far fa-clock fa-fw" aria-hidden="true"></i>&nbsp;{{ T "readingTime" .ReadingTime }}&nbsp;
    {{- $comment := .Scratch.Get "comment" | default dict -}}
    {{- if $comment.enable | and $comment.valine.enable | and $comment.valine.visitor -}}
        <span id="{{ .RelPermalink }}" class="leancloud_visitors" data-flag-title="{{ .Title }}">
            <i class="far fa-eye fa-fw" aria-hidden="true"></i>&nbsp;<span class=leancloud-visitors-count></span>&nbsp;{{ T "views" }}
        </span>&nbsp;
    {{- end -}}
    <div id="d-counter"></div>
</div>
{{< /highlight >}}


最终，新添加的文件目录如下，重新生成站点就能看到效果了。

```
DarkGoleBar.github.io/
├── layouts/
│   ├── partials
│   │   └── comment.html
│   └── posts
│       └── single.html
└── static
    ├── css
    |   └── comment.css
    └── js
        └── comment.js
```
