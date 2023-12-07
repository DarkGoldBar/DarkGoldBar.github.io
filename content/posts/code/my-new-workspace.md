---
title: "新工作环境记录"
subtitle: ""
date: 2022-12-07T14:36:46+08:00
lastmod: 2022-12-07T14:36:46+08:00
draft: false
author: ""
authorLink: ""
description: ""
license: ""
images: []

tags: ['shell']
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

简单记录自己的构建新环境用的代码

<!--more-->

``` bash
# 改密码
passwd

# 切换默认shell为bash
chsh -s /bin/bash

# 基础配置
mkdir .ssh tmp work
touch .ssh/authorized_keys
cat << EOF > .bash_aliases
alias tarxz='tar -I "xz -T0" -cf'
alias conda-activate='conda activate'
alias conda-deactivate='conda deactivate'
EOF

# 安装conda
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O tmp/Miniconda3-latest-Linux-x86_64.sh
bash tmp/Miniconda3-latest-Linux-x86_64.sh

## JupyterLab
cat << EOF > .condarc
channels:
  - defaults
show_channel_urls: true
default_channels:
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/r
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/msys2
custom_channels:
  conda-forge: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  msys2: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  bioconda: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  menpo: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  pytorch: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  pytorch-lts: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  simpleitk: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  deepmodeling: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/
EOF
conda install jupyterlab ipympl -y
conda install -c conda-forge nodejs -y
jupyter labextension install @jupyter-widgets/jupyterlab-manager jupyter-matplotlib
cat << EOF > .jupyter/jupyter_server_config.py
c = get_config()
c.ServerApp.ip = '0.0.0.0'
EOF
cat << EOF >> .bashrc
if screen -ls "jupyter" > /dev/null ; then 
    jupyter server list > tmp/jpy &
else
    screen -dmS "jupyter" $(which jupyter) server
    bash -c "sleep 3; jupyter server list > tmp/jpy " &
fi
EOF

# 新建conda环境
conda create -n py3 python ipython pandas scipy matplotlib -y
conda activate py3
python -m ipykernel install --user
```
