---
title: "使用方法记录"
date: 2022-11-24T14:41:20+08:00
draft: false
author: DarkGoldBar
authorLink: https://darkgoldbar.github.io/hugo
---

## 文档编辑语法
[基础语法](https://hugoloveit.com/zh-cn/basic-markdown-syntax/)
[扩展语法](https://hugoloveit.com/zh-cn/theme-documentation-content/)
[简便语法](https://hugoloveit.com/zh-cn/theme-documentation-built-in-shortcodes/)
[扩展简便语法](https://hugoloveit.com/zh-cn/theme-documentation-extended-shortcodes/)

### 插图
静态图片复制到`static/images/`目录下，然后在MD中引用
```
![雪山](/images/270px-梅里雪山.jpg)
```
![雪山](/images/270px-梅里雪山.jpg)



## shell 命令 

创建一个新的文章
```
hugo new posts/first_post.md
```

关闭github的功能
```
touch .nojekyll
```


## config.toml 设置

主题设置
```
theme = 'LoveIt'
```

更改输出文件夹为gitpage的可用目录
```
publishDir = 'docs'
```
