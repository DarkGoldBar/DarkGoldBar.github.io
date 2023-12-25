---
title: "Hugo-LoveIt代码笔记"
subtitle: ""
date: 2022-10-24T14:41:20+08:00
lastmod: 2023-01-28T11:50:00+08:00
draft: false
author: ""
authorLink: ""
description: "Hugo-LoveIt代码笔记"
license: ""
images: []

tags: ['hugo']
categories: ['代码笔记']
---

## 命令行
创建一个新的文章
```
hugo new [path] [flags]
hugo new posts/1.md
```

开启本地预览
```
hugo serve -D
```

## 文档编辑
### 语法
- [基础语法](https://hugoloveit.com/zh-cn/basic-markdown-syntax/)
- [扩展语法](https://hugoloveit.com/zh-cn/theme-documentation-content/)
- [简便语法](https://hugoloveit.com/zh-cn/theme-documentation-built-in-shortcodes/)
- [扩展简便语法](https://hugoloveit.com/zh-cn/theme-documentation-extended-shortcodes/)

### 插图
静态图片复制到`static/images/`目录下，然后在MD中引用  
`![雪山](/images/270px-梅里雪山.jpg)`  
或者  
`{{< image src="/images/270px-梅里雪山.jpg" caption="雪山">}}`  

![雪山](/images/270px-梅里雪山.jpg)

----------------------------------------

## 设置
### 文章模板
文章模板目录为archetypes文件夹, 可以在执行`hugo new`命令时指定不同的模板创建

### config.toml 站点设置
```
baseURL = "https://darkgoldbar.github.io"
publishDir = 'public'
```
