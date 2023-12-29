---
title: "ffmpeg代码笔记"
subtitle: ""
date: 2022-11-15T15:30:00+08:00
lastmod: 2023-03-07T17:24:00+08:00
draft: false
author: ""
authorLink: ""
description: "常用ffmpeg命令，和部分命令的参数解释"
license: ""
images: []

tags: ['ffmpeg']
categories: ['代码笔记']

summary: "常用命令, 参数, 滤镜 的简单记录"
---

## ffmpeg  
![ffmpeg](https://trac.ffmpeg.org/ffmpeg-logo.png)  
[ffmpeg官网下载](https://ffmpeg.org/download.html)   

-------------------------------------

### 常用命令

{{< highlight shell "linenos=table">}}
# 基础格式转换
ffmpeg -i video.avi video.mp4

# 图片转视频
ffmpeg -r 10 -i image_%4d.jpg -vf eq=brightness=0.06:saturation=1 video.mp4 -y

# 视频转gif
ffmpeg -ss 00:00:01.00 -t 10 -i baiweibing.mp4 \
-vf "fps=16,scale=160{?:}-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=32:reserve_transparent=0[p];[s1][p]paletteuse" \
output.gif
{{< /highlight >}}

### 参数
- -i : 输入文件 `image_%4d.jpg` 表示 `image_0000.jpg -> image_9999.jpg`
- -r : 帧率
- -t : 截取多少秒
- -ss : 从什么时间开始 
- -vf : 视频滤镜
- -y : 确认覆盖同名输出文件

### 输出x264编码
`c:v libx264 output.mp4`
- `-crf` : 调整动态码率，范围0(最佳)-51(最差)， 默认23
- `-preset` : 调整质量
    - ultrafast
    - superfast
    - veryfast
    - faster
    - fast
    - **medium 默认值**
    - slow
    - slower
    - veryslow
- `-tune`: 特定片源调整
    - film  *电影*
    - animation  *动画*
    - grain  *胶片颗粒*
    - stillimage  *定格图片*
    - fastdecode  *快速解码*
    - zerolatency  *无延迟*
- `-profile:v`: 
    - baseline
    - main
    - high
    - high10  *(first 10 bit compatible profile)*
    - high422 *(supports yuv420p, yuv422p, yuv420p10le and yuv422p10le)*
    - high444 *(supports as above as well as yuv444p and yuv444p10le)*

[英文原文](https://trac.ffmpeg.org/wiki/Encode/H.264)

### 输出Xvid编码
`c:v mpeg4 -vtag xvid output.avi`

- `-qscale:v` : 调整动态码率，范围1(最佳)-31(最差)

{{< admonition tip "Tip" true >}}
这里使用 AVI 容器文件作为示例，因为 XviD 视频目前最常见的用途是用于较旧的硬件设备。
{{< /admonition >}}
[英文原文](https://trac.ffmpeg.org/wiki/Encode/MPEG-4)

### 滤镜
- `setpts=2.0*PTS` : 调整视频速率
- `fps=16` : fps
- `scale=160:-1:flags=lanczos`: 缩放
- `split...paletteuse` : gif调色盘, gif加上就对了


## ffmpeg.wasm
- [Example code](https://codepen.io/jeromewu/pen/NWWaMeY)
