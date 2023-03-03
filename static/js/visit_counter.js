
var CurrentPage=window.location.origin + window.location.pathname;
var vcresponse=null;


window.addEventListener('load', vconload);

function vconload() {
    if (vccheck()) {
        vcrequest('get');
    } else {
        vcrequest('update');
    }
}


function vcrequest(action) {
    let url=window.location.origin + window.location.pathname;
    let server = "https://3jrymxtdceti2icc6r4mgqmpei0gzzls.lambda-url.ap-northeast-3.on.aws/";
    let data = {page: CurrentPage, action: action};
    let xmlhttp = new XMLHttpRequest();
    let resp_data = null;

    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            resp_data = JSON.parse(this.responseText);
            vcrender(resp_data);
        } else if (this.readyState == 4 && this.status != 200) {
            console.log('visit counter API failed');
            vcresponse = this;
        }
    };

    xmlhttp.open("POST", server);
    xmlhttp.send(JSON.stringify(data));
}


function vccheck(){
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


function vcrender(data) {
    // data = {last:"1675853136",visit:"6"}
    let vcnode = document.getElementById('visitCount');
    let d = new Date();
    d.setTime(Number(data.last + "000"));
    vcnode.innerHTML = 'Count: <span>' +data.visit+ '</span> Last: <span>' +d.toISOString()+ '</span>'
}
