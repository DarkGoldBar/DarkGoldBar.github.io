<script setup>
import { ref, onMounted } from 'vue';
var text = ref("https://darkgoldbar.github.io/");
var width = ref(128);
var height = ref(128);
var colorDark = ref("#000000");
var colorLight = ref("#ffffff");
var correctLevel = ref("H");

onMounted(() => {
  const script = document.createElement('script');
  script.onload = function () {
    generateQRCode();
  }
  script.onerror = function () {
    alert('qrcodejs failed!')
  }
  script.setAttribute('src', 'https://cdn.bootcdn.net/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
  document.head.appendChild(script);
})

function generateQRCode() {
  const cLevelMap = {
    "L": 1,
    "M": 0,
    "Q": 3,
    "H": 2
  }
  const config = {
    text: text.value,
    width: width.value,
    height: height.value,
    colorDark: colorDark.value,
    colorLight: colorLight.value,
    correctLevel: cLevelMap[correctLevel.value]
  }
  document.getElementById('qrcode').innerHTML = '';
  new QRCode('qrcode', config);
}
</script>

<template>
  <table>
    <tbody>
      <tr>
        <td>文字</td>
        <td>
          <input type="text" v-model="text" @change="generateQRCode()">
        </td>
      </tr>
      <tr>
        <td>宽度</td>
        <td>
          <input type="number" v-model="width" @change="generateQRCode()">
        </td>
      </tr>
      <tr>
        <td>高度</td>
        <td>
          <input type="number" v-model="height" @change="generateQRCode()">
        </td>
      </tr>
      <tr>
        <td>前景色</td>
        <td>
          <input type="color" v-model="colorDark" @change="generateQRCode()">
        </td>
      </tr>
      <tr>
        <td>背景色</td>
        <td>
          <input type="color" v-model="colorLight" @change="generateQRCode()">
        </td>
      </tr>
      <tr>
        <td>纠错等级</td>
        <td>
          <select v-model="correctLevel" @change="generateQRCode()">
            <option value="L">L</option>
            <option value="M">M</option>
            <option value="Q">Q</option>
            <option value="H">H</option>
          </select>
        </td>
      </tr>
    </tbody>
  </table>
  <hr>
  <div id="qrcode"></div>
</template>

<style scoped>
table, th, td {
  border: 1px solid;
}
table {
  border-collapse: collapse;
}
td {
  padding: 5px;
}
</style>
