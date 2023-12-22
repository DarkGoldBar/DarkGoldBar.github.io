---
title: "Nginx学习笔记"
subtitle: ""
date: 2023-07-18T16:53:00+08:00
lastmod: 2023-07-18T16:53:00+08:00
draft: false
author: ""
authorLink: ""
description: ""
license: ""
images: []

tags: ['nginx']
categories: ['代码笔记']

keywords:
    - nginx
    - nginx教程
    - nginx学习笔记
    - 本地服务
---

使用nginx，经过简单的配置，给本地服务制作一个功能目录
<!--more-->

## 目录结构
根据自己的实践，这样的目录结构比较适合在可信任环境中快速在本地部署服务

```
.
├── nginx
│   ├── conf.d
│   ├── ssl
│   └── www
├── run_nginx.sh
├── run_scripts.sh
├── script
│   ├── run_calc_service.sh
│   ├── run_download_service.sh
│   └── run_upload_service.sh
└── tmp
    ├── download
    └── upload
```

- `nginx/conf.d` 目录存放nginx的路由配置文件
- `nginx/ssh` 目录存放https所需要的密钥文件
- `run_nginx.sh` 脚本启动nginx服务
- `script` 目录存放每个服务的启动脚本
- `run_scripts.sh` 脚本通过调用`script`目录中的脚本，在本地端口启动其他服务


## nginx启动
```bash
if [ -z "$WORKDIR" ]; then
  WORKDIR="$(dirname "$(realpath "$0")")"
fi

docker run --network host \
  -v "$WORKDIR/nginx/conf.d:/etc/nginx/conf.d" \
  -v "$WORKDIR/nginx/www:/data/www" \
  -v "$WORKDIR/nginx/ssl:/data/ssl" \
  nginx
```

- 这个启动脚本把conf.d映射到nginx的配置目录，提供服务器配置
- 把www和ssl映射到/data目录下，提供服务器主页和SSL

在正确配置docker的情况下这个脚本会拉取公共镜像仓库中的nginx镜像并启动。


## 一个简单的目录页面

简单写一个HTML，我这里就只用了`<ul><li><a>`的形式列出了几个链接。
本地连接`<a href="/download">`这个标签对应的地址就是`10.2.0.7/download`，
这个地址对应的具体服务我们在后面的nginx配置中实现。
最后发给GPT，让ta美化页面，把写好的CSS保存到`style.css`

```HTML
<!DOCTYPE html>
<html>
<head>
    <title>10.2.0.77 - index</title>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>10.2.0.77</h1>
    <h2>导航主页</h2>
    <ul>
        <li><a href="/download">下载文件</a></li>
        <li><a href="/upload">上传文件</a></li>
        <li><a href="/localGPT">其他服务</a></li>
        <li><a href="https://DarkGoldBar.github.io">外部网站链接</a></li>
    </ul>
</body>
</html>
```


## nginx配置
这里直接放上简单的HTTP/HTTPS配置
```
server {
    # 端口80
    listen 80;
    # 仅在有域名的情况下使用，这里我们就随便写一个
    server_name localhost;
    charset utf-8;

    # serve文件时的目录
    root /data/www;
    # 自动跳转主页
    index /index.html;

    # 配置路径对应的本地服务地址
    # 这里就是把 http://localhost/download 对应到 http://localhost:8100/
    location /download/ {
        proxy_pass http://localhost:8100/;
        proxy_http_version                   1.1;
        proxy_set_header   Connection        $connection_upgrade;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
    }
}

server {
    # HTTPS端口
    listen 443;
    server_name localhost;
    charset utf-8;

    root /data/www;
    index /index.html;

    # SSL配置
    # 网上找个自签名脚本就行
    ssl on;
    ssl_certificate     /data/ssl/10.2.0.77.crt;
    ssl_certificate_key /data/ssl/10.2.0.77.key;

    # 这些配置都要再写一遍
    location /download/ {
        proxy_pass http://localhost:8100/;
        proxy_http_version                   1.1;
        proxy_set_header   Connection        $connection_upgrade;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
    }
}
```
