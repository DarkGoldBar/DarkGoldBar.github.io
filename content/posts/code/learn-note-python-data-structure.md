---
title: "python数据结构笔记"
subtitle: ""
date: 2023-04-17T18:00:00+08:00
lastmod: 2023-04-17T18:00:00+08:00
draft: false
author: ""
authorLink: ""
description: ""
license: ""
images: []

tags: ['python']
categories: ['代码笔记']
---

记录一些方便使用的python代码片段

<!--more-->

## 从字典构造Enum枚举类型

``` python
DATA = {'alice': {}, 'bob': {}}

class MyEnumBase():
    def __init__(self, *args):
        self._data = {}

    def get_data(self) -> dict:
        return self._data.copy()

    @property
    def foo(self) -> int:
        return int(self._data["foo"])

class MyEnum(MyEnumBase, Enum):
    """MyEnum type
    """
    def __init__(self, *args):
        super().__init__(*args)
        self._data = DATA[self._value_]
        self.__doc__ = MyEnum.__doc__

MyEnumClass = MyEnum('MyEnumClass', {k: k for k in DATA})
```


## 构造namedtuple类型

``` python
class Gems(namedtuple('Gems', list('rgbwd'), defaults=[0, 0, 0, 0, 0])):
    def __add__(self, other):
        return self.__class__(*(x+y for x, y in zip(self, other)))

    def __sub__(self, other):
        return self.__class__(*(x-y for x, y in zip(self, other)))

    @property
    def gtz(self) -> 'Gems':
        """greater than zero"""
        return self.__class__(*(max(0, x) for x in self))
```


## 命令行接口模块
使用`click`库。读取当前目录的所有文件作为子命令。

``` python
@click.group()
def cli_group():
    pass

if '__path__' in locals():
    _path_ = __path__
else:
    _path_ = [os.path.dirname(__file__)]

for _, module_name, _ in pkgutil.walk_packages(_path_):
    module = importlib.import_module('.' + module_name, __package__)
    if hasattr(module, 'cli'):
        command_name = module_name.replace("_", "-")
        cli_group.add_command(module.cli, name=command_name)

cli_group()
```
