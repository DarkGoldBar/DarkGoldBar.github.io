---
title: "二维码生成器"
subtitle: ""
date: 2023-01-28T18:07:41+08:00
lastmod: 2023-11-22T00:12:00+08:00
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
    qrcode: "https://cdn.jsdelivr.us/npm/qrcodejs@1.0.0/qrcode.min.js"
seo:
  images: []
---

<!-- 正文 -->

## 二维码设置
---------------------------
{{< raw >}}
<style>
  #qrcode-form {
    border-collapse: collapse;
  }
  #qrcode-form td {
    border: 1px solid black;
    padding: 8px;
    text-align: left;
    width: auto;
    white-space: nowrap;
  }
</style>

<form id='qrcode-form' onchange='generateQRCode()'>
  <table>
    <tr>
      <td><label for="content">内容：</label></td>
      <td><input type="text" id="qr-content" name="content"></td>
    </tr>
    <tr>
      <td><label for="size">大小：</label></td>
      <td>
        <input type="range" id="qr-size" name="size" min="40" max="640" value="80" oninput="document.getElementById('size-value').innerHTML=this.value">
        <span id="size-value">80</span>
      </td>
    </tr>
    <tr>
      <td><label for="fg-color">前景色：</label></td>
      <td><input type="color" id="qr-fg-color" name="fg-color"></td>
    </tr>
    <tr>
      <td><label for="bg-color">背景色：</label></td>
      <td><input type="color" id="qr-bg-color" name="bg-color" value="#FFFFFF"></td>
    </tr>
  </table>
</form>
{{< /raw >}}

## 二维码
---------------------------
{{< raw >}}
<div id="qrcode"></div>
{{< /raw >}}

{{< script >}}
window.addEventListener('keydown',function(e){if(e.keyIdentifier=='U+000A'||e.keyIdentifier=='Enter'||e.keyCode==13){if(e.target.nodeName=='INPUT'&&e.target.type=='text'){e.preventDefault();generateQRCode();return false;}}},true);

function generateQRCode() { 
  document.getElementById('qrcode').innerHTML = '';
  var params = {
    text: document.getElementById("qr-content").value,
    width: document.getElementById("qr-size").value,
    height: document.getElementById("qr-size").value,
    colorDark : document.getElementById("qr-fg-color").value,
    colorLight : document.getElementById("qr-bg-color").value,
    correctLevel : QRCode.CorrectLevel.H
  };
  var qrcode = new QRCode("qrcode", params); 
}
{{< /script >}}
