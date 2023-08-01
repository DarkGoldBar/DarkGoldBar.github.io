---
title: "Nginx学习笔记"
subtitle: ""
date: 2023-07-18T16:53:00+08:00
lastmod: 2023-07-18T16:53:00+08:00
draft: true
author: ""
authorLink: ""
description: ""
license: ""
images: []

tags: ['Shell']
categories: ['代码笔记']
---



<!--more-->

## 常用命令

### ps without ps
使用nginx镜像时，镜像中没有ps命令，使用这个命令
`ls -l /proc/*/exe`

### nginx reload config
`kill -HUP ${pid_of_nginx}`

