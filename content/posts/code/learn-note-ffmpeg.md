---
title: "ffmpeg代码笔记"
date: 2022-11-15T15:30:00+08:00
draft: false
author: DarkGoldBar
authorLink: https://darkgoldbar.github.io
tags: ['shell']
categories: ['代码笔记']
enableEmoji: false
---

## ffmpeg  
![ffmpeg](https://upload.wikimedia.org/wikipedia/commons/5/5f/FFmpeg_Logo_new.svg)  
[ffmpeg官网下载](https://ffmpeg.org/download.html)   


-------------------------------------

### 常用命令

```
# 基础格式转换
ffmpeg -i video.avi video.mp4
# 图片转视频
ffmpeg -r 10 -i image_%4d.jpg -vf eq=brightness=0.06:saturation=1 video.mp4 -y
# 视频转gif
ffmpeg -ss 00:00:01.00 -t 10 -i baiweibing.mp4 \
-vf "fps=16,scale=160{?:}-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=32:reserve_transparent=0[p];[s1][p]paletteuse" \
output.gif
```

### 参数
- -i : 输入文件 `image_%4d.jpg` 表示 `image_0000.jpg -> image_9999.jpg`
- -r : 帧率
- -t : 截取多少秒
- -ss : 从什么时间开始 
- -vf : 视频滤镜
- -y : 确认覆盖同名输出文件

### 滤镜
- "setpts=2.0*PTS" : 调整视频速率
- "fps=16" : fps
- "scale=160:-1:flags=lanczos" : 缩放
- "split...paletteuse" : gif调色盘, gif加上就对了
