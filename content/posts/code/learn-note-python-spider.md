---
title: "python爬虫代码笔记"
subtitle: ""
date: 2023-01-18T13:54:00+08:00
lastmod: 2023-05-16T16:53:00+08:00
draft: false
author: ""
authorLink: ""
description: ""
license: ""
images: []

tags: ['Python']
categories: ['代码笔记']
---

### import环境
```
import requests
from pandas import DataFrame  
from bs4 import BeautifulSoup  # pip install beautifulsoup4
```

### 链接设置
这里是用的本地http服务器代理，爬nist的数据  
可以用v2ray把其他类型的代理变成一个本地http代理  

`proxies` 指定代理  
`user_agent` 指定UA

``` python
proxies_pool = [
    {},
    {'http': '172.19.0.11:8118','https': '172.19.0.11:8118'}
]
user_agent_pool = [
    "Mozilla/5.0 (Macintosh; U; Mac OS X Mach-O; en-US; rv:2.0a) Gecko/20040614 Firefox/3.0.0 ",
    "Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10.5; en-US; rv:1.9.0.3) Gecko/2008092414 Firefox/3.0.3",
    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.5; en-US; rv:1.9.1) Gecko/20090624 Firefox/3.5",
    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-US; rv:1.9.2.14) Gecko/20110218 AlexaToolbar/alxf-2.0 Firefox/3.6.14",
    "Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10.5; en-US; rv:1.9.2.15) Gecko/20110303 Firefox/3.6.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0.1) Gecko/20100101 Firefox/4.0.1"
]
headers = {
    'user_agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'authority':'patents.google.com',
    'method':'GET',
    'scheme':'https',
    'accept':'*/*',
    'accept-encoding':'gzip, deflate, br',
    'accept-language':'zh-CN;q=0.8,zh;q=0.7;en,en-US;q=0.6'
}
```

### 获取网页
``` python
import requests
from requests.exceptions import Timeout, RequestException

def getPage(url, timeout=30, retry_count=2):
    proxies = random.choice(proxies_pool)
    user_agent = random.choice(user_agent_pool)
    headers_ = headers.copy()
    headers_['User_agent'] = user_agent
    soup = None

    for i in range(retry_count):
        try:
            response = requests.get(url, proxies=proxies, headers=headers_, timeout=timeout)
            if not response:
                print(f"Status code = {response.status_code},  retrying...")
                continue
            soup = BeautifulSoup(response.content)
            break
        except Timeout:
            print(f"Request Timeout {i}, retrying...")
        except RequestException as e:
            print(f"Request error: {e}")
            break
    else:
        print("Failed to fetch the page after multiple retries.", url)
    return soup
```

### 常用方法和参数


|BS4查询方法|功能|
|---|---|
|`soup.find`        |查询第一个子节点|
|`soup.find_all`    |查询所有子节点|
|`soup.find_parent` |查询第一个父节点|
|`soup.find_parents`|查询所有父节点|
|`soup.select`      |CSS选择器|


|BS4节点访问|功能|
|---|---|
|`node.name`|HTML Tag name|
|`node.attrs`|所有 HTML 属性的字典|
|`node[attr]`|一个 HTML 属性值|
|`node.contents`|子节点的列表|
|`node.children`|子节点的生成器|
|`str(node)`|HTML|
|`node.text`|innerText|
