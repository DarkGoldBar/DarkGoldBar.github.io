---
title: "python爬虫代码笔记"
subtitle: ""
date: 2023-01-18T13:54:00+08:00
lastmod: 2023-01-28T11:20:00+08:00
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

### 获取数据
这里是用的本地http服务器代理，爬nist的数据  
可以用v2ray把其他类型的代理变成一个本地http代理  

`requests.get` 获取网页  
`proxies` 参数指定代理  
`timeout` 参数指定超时时间，不设超时容易出现卡死  

```
proxies = {
   'http': '172.19.0.11:8118',
   'https': '172.19.0.11:8118',
}
url = 'https://srdata.nist.gov/solubility/sys_category.aspx'
response = requests.get(url, proxies=proxies, timeout=10)
```

### 解析
```
soup = BeautifulSoup(response.content)

ele = soup.find("select", {"id": "MainContentPlaceHolder_DDL_Sys"})
ele2 = ele.find_all("option")

value_list = []
name_list = []
for e in ele2:
    value_list.append(e['value'])
    name_list.append(e.text)
index = DataFrame({'value': value_list, 'name': name_list})
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
