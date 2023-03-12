var CurrentPage=window.location.origin + window.location.pathname;
var vcSite="https://darkgoldbar.github.io";
var vcServer="https://3jrymxtdceti2icc6r4mgqmpei0gzzls.lambda-url.ap-northeast-3.on.aws/";
var vcResponse=null;

window.addEventListener('load', vcOnLoad);

function vcOnLoad() {
  if (window.location.origin == vcSite){
    if (vcCheck()) {
      vcRequest('GET');
    } else {
      vcRequest('POST');
    }
  }
}

function vcRequest(method) {
  let xhr = new XMLHttpRequest();
  xhr.responseType = 'json';

  xhr.onload = function() {
    vcRender(this.response);
  };

  xhr.open(method, vcServer);
  xhr.setRequestHeader("x-referer-page", window.location.pathname);
  xhr.send();
}

function vcCheck(){
  let cookie_key = 'last_visit:' + CurrentPage;
  let currentTimeStamp = new Date().getTime();
  let lastTimeStamp = new Number(localStorage.getItem(cookie_key));
  localStorage.setItem(cookie_key, currentTimeStamp);
  return (lastTimeStamp && ((currentTimeStamp - lastTimeStamp) < 24 * 60 * 60 * 1000))
}

function vcRender(data) {
  let vcnode = document.getElementById('visitCount');
  let ts = Number(data.last + "000");
  vcnode.innerHTML = `浏览次数: ${data.visit} 最后访问: ${formatDateTime(ts)}`
}

function formatDateTime(timestamp) {
  // written by chatGPT
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return year + '年' + month + '月' + day + '日 ' + hour + '时' + minute + '分' + second + '秒';
}
