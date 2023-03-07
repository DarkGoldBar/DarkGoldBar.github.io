var CurrentPage=window.location.origin + window.location.pathname;
var vcSite="https://darkgoldbar.github.io";
var vcServer="https://3jrymxtdceti2icc6r4mgqmpei0gzzls.lambda-url.ap-northeast-3.on.aws/";
var vcResponse=null;

window.addEventListener('load', vcOnLoad);

function vcOnLoad() {
    if (window.location.origin == vcSite){
        if (vcCheck()) {
            vcRequest('get');
        } else {
            vcRequest('update');
        }
    }
}

function vcRequest(action) {
    let data = {page: CurrentPage, action: action};
    let xmlhttp = new XMLHttpRequest();
    let resp_data = null;

    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            resp_data = JSON.parse(this.responseText);
            vcRender(resp_data);
        } else if (this.readyState == 4 && this.status != 200) {
            console.log('visit counter API failed');
            vcResponse = this;
        }
    };

    xmlhttp.open("POST", vcServer);
    xmlhttp.send(JSON.stringify(data));
}

function vcCheck(){
    let visited = false;
    let cookie_key = 'last_visit:' + CurrentPage;
    let currentTimeStamp = new Date().getTime();
    let lastTimeStamp = new Number(localStorage.getItem(cookie_key));
    if (lastTimeStamp && ((currentTimeStamp - lastTimeStamp) < 24 * 60 * 60 * 1000)) {
        visited = true;
    }
    localStorage.setItem(cookie_key, currentTimeStamp);
    return visited
}

function vcRender(data) {
    // data = {last:"1675853136",visit:"6"}
    let vcnode = document.getElementById('visitCount');
    let ts = Number(data.last + "000");
    vcnode.innerHTML = '浏览次数: <span>' +data.visit+ '</span> 最后访问: <span>' +formatDateTime(ts)+ '</span>'
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
  