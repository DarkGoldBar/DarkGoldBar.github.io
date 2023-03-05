var CurrentPage=window.location.origin + window.location.pathname;
var vcServer="https://3jrymxtdceti2icc6r4mgqmpei0gzzls.lambda-url.ap-northeast-3.on.aws/";
var vcResponse=null;

window.addEventListener('load', vcOnLoad);

function vcOnLoad() {
    if (vcCheck()) {
        vcRequest('get');
    } else {
        vcRequest('update');
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
    let d = new Date();
    d.setTime(Number(data.last + "000"));
    vcnode.innerHTML = '浏览次数: <span>' +data.visit+ '</span> 最后访问: <span>' +d.toISOString()+ '</span>'
}
