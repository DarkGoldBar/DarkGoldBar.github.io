---
title: "Windows下建立新的Hugo工作环境"
subtitle: ""
date: 2023-01-27T22:19:02+08:00
lastmod: 2023-12-22T11:30:00+08:00
draft: false
author: ""
authorLink: ""
description: "Windows下建立新的Hugo工作环境"
license: ""
images: []

tags: ['hugo']
categories: ['代码笔记']
---

## 安装 VSCode
官网下载安装  
https://code.visualstudio.com/Download 

## 安装git
打开VSCode, 侧栏里打开git面板, 没有找到git的时候, 会提示你下载安装git, 跟随链接安装即可
(此处应有图)

## 设置以ssh方式操作代码仓库
在VSCode里点新建终端  
新建终端我这里是powershell, 手动切换到git bash  
(此处应有图)

### 设置git用户
第一次使用git需要先设置用户名和邮箱地址  
这里填写自己的名字和邮箱, 会记录在创建的提交里, 可以任意填写, 身份认证以后面的ssh密钥为准  
```
git config --global user.name "DarkGoldBar"
git config --global user.email username@domain.com
```

### 生成ssh密钥
执行 

`cd; mkdir .ssh; cd .ssh; ssh-keygen`

按几下回车, 出现这个指纹图就表示正常结束了, `ls`命令可以看到生成了两个文件, 带 '.pub' 后缀的公钥文件和不带后缀的私钥文件

```
+---[RSA 3072]----+
|   +             |
|  .              |
| .               |
|o                |
|       oS        |
|+       .        |
|.  + + E         |
|o                |
|                 |
+----[SHA256]-----+
```

### 生成ssh密钥
执行 

`code id_rsa.pub` 

打开公钥文件, 为接下来添加git密钥列表做准备  
打开github的设置页 https://github.com/settings/keys , 点[New SSH key]  
把已经打开的公钥文本粘贴进去, 这里可以确认一下公钥文本以'ssh-rsa'开头  

## 克隆仓库
在github上注册里公钥之后, 就可以克隆仓库了

这里以在d盘, 创建一个code目录, 在此目录下工作为例, 执行
`cd /d; mkdir code; cd code`
`git clone git@github.com:DarkGoldBar/DarkGoldBar.github.io.git`

这里第一次ssh访问github会问你确认, 输yes回车

> $ git clone git@github.com:DarkGoldBar/DarkGoldBar.github.io.git
Cloning into 'DarkGoldBar.github.io'...
The authenticity of host 'github.com (20.205.243.166)' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxx.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes

打开项目
VSCode文件菜单选打开文件夹, 选择 D:/code/DarkGoldBar.github.io 目录打开

### 克隆子仓库
如果项目已经使用了主题, 需要通过加载子模块的方式克隆主题的仓库  
`cd DarkGoldBar.github.io`
`git submodule update --init --recursive`

## 安装 Hugo
安装包地址: https://github.com/gohugoio/hugo/releases/

下载windows的hugo_extended版本  
`hugo_extended_0.110.0_windows-amd64.zip`

下载解压出 `hugo.exe`  
我这里是解压到 `D:/code/Hugo/` 目录下

### 设置环境变量
win10 自带搜索搜 '环境变量', 选编辑环境变量  
系统变量 -> Path -> 新建 -> `D:/code/Hugo/` -> 确定  
重启VSCode, 在 Powershell/CMD 终端里输入 `hugo help` , 确认能找到hugo程序即可
