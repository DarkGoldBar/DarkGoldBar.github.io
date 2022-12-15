---
title: "使用方法记录"
date: 2022-11-24T14:41:20+08:00
draft: false
author: DarkGoldBar
authorLink: https://darkgoldbar.github.io
tags: ['测试']
categories: ['测试分类']
---

## 文档编辑
### 语法
- [基础语法](https://hugoloveit.com/zh-cn/basic-markdown-syntax/)
- [扩展语法](https://hugoloveit.com/zh-cn/theme-documentation-content/)
- [简便语法](https://hugoloveit.com/zh-cn/theme-documentation-built-in-shortcodes/)
- [扩展简便语法](https://hugoloveit.com/zh-cn/theme-documentation-extended-shortcodes/)

### 插图
静态图片复制到`static/images/`目录下，然后在MD中引用  
```
![雪山](/images/270px-梅里雪山.jpg)
```
![雪山](/images/270px-梅里雪山.jpg)

----------------------------------------

## 各种设置
### shell 命令 

创建一个新的文章
```
hugo new posts/first_post.md
```

开启本地预览
```
hugo serve
```

关闭本地预览 `ctrl + c`


### config.toml 设置

更改输出文件夹为gitpage的可用目录
```
publishDir = 'docs'
```
