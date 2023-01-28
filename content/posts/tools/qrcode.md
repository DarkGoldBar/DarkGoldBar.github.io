---
title: "二维码生成器"
subtitle: ""
date: 2023-01-28T18:07:41+08:00
lastmod: 2023-01-28T18:07:41+08:00
draft: false
author: ""
authorLink: ""
description: ""
license: ""
images: []

tags: []
categories: ['工具']

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
    qrcode: "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"
seo:
  images: []
---

<!-- 正文 -->
{{< raw >}}
<div>
  <p>
    <label for="text">输入文本: </label>
    <input type="text" id="qrcode-text" name="text">
  </p>
  <p>
    <label for="text">二维码大小: </label>
    <input type="text" id="qrcode-size" name="size" value="128">
  </p>
  <p>
    <label for="text">二维码颜色: </label>
    <input type="text" id="qrcode-color" name="color" value="#000000">
  </p>
  <p>
    <label for="text">二维码背景颜色: </label>
    <input type="text" id="qrcode-bgcolor" name="bgcolor" value="#ffffff">
  </p>
  <p>
    <button onclick="generateQRCode()">生成二维码</button>
  </p>
</div>
<div id="qrcode"></div>
{{< /raw >}}

{{<script>}}
function generateQRCode() { 
  document.getElementById('qrcode').innerHTML = '';
  var params = {
    text: document.getElementById("qrcode-text").value,
    width: document.getElementById("qrcode-size").value,
    height: document.getElementById("qrcode-size").value,
    colorDark : document.getElementById("qrcode-color").value,
    colorLight : document.getElementById("qrcode-bgcolor").value,
    correctLevel : QRCode.CorrectLevel.H
  };
  var qrcode = new QRCode("qrcode", params); 
}
{{</script>}}
