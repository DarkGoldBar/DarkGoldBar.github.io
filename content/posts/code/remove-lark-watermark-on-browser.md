---
title: "去除网页版飞书水印"
subtitle: ""
date: 2022-12-16T09:59:51+08:00
lastmod: 2023-01-28T11:20:00+08:00
draft: false
author: ""
authorLink: ""
description: "去除网页版飞书水印"
license: ""
images: []

tags: ['javascript']
categories: ['代码笔记']
---

F12调控制台，把JS代码粘贴进去运行
去掉水印之后，网页会卡住在一个白色屏幕，失去所有交互。  
但是如果提前打开准备截图的聊天界面，往下拉还是可以看到已经加载的聊天内容。

```
regex = /data\:image\/svg\+xml;base64,[a-zA-Z0-9+\=]+/g;
body = document.getElementsByTagName('body')[0];
body.innerHTML = body.innerHTML.replace(regex, 'AAA');
```
