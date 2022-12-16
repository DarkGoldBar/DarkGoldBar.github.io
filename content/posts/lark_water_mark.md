---
title: "飞书去水印"
date: 2022-12-16T09:59:51+08:00
draft: true
author: DarkGoldBar
authorLink: https://darkgoldbar.github.io
tags: ['javascript']
categories: ['代码笔记']
enableEmoji: false
---

直接上代码

```
regex = /data\:image\/svg\+xml;base64,[a-zA-Z0-9+\=]+/g;
body = document.getElementsByTagName('body')[0];
body.innerHTML = body.innerHTML.replace(regex, 'AAA');
```

去掉之后，网页会卡住在一个白色屏幕，失去所有交互。  
但是如果提前打开准备截图的聊天界面，往下拉还是可以看到已经加载的聊天内容。
