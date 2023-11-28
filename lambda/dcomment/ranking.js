var dcomServer="https://27n4glpsqowyvyndhv4tltfoby0ovlty.lambda-url.ap-northeast-3.on.aws/";
var data_example = [{"Counter": 4, "page": "https://darkgoldbar.github.io/posts/ljh/ljh004/"}, 
                    {"Counter": 6, "page": "https://darkgoldbar.github.io/posts/ljh/ljh030/"}];

function ranking_request(origin) {
    const xhr = new XMLHttpRequest();
    let query = "?action=" + "VCRanking"
    if (origin != null) {
        query += "&origin=" + origin;
    }
    xhr.open("GET", dcomServer + query, true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let data = JSON.parse(xhr.responseText);
            ranking_render(data);
        }
    }
}

function ranking_render(data) {
    // render ranking table in "ranking-table" element
    let ranking = document.getElementById("ranking-table");
    let table = document.createElement("table");
    table.setAttribute("class", "table table-striped table-bordered table-hover");
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let th1 = document.createElement("th");
    let th2 = document.createElement("th");
    th1.setAttribute("scope", "col");
    th2.setAttribute("scope", "col");
    th1.innerHTML = "Counter";
    th2.innerHTML = "Page";
    tr.appendChild(th1);
    tr.appendChild(th2);
    thead.appendChild(tr);
    table.appendChild(thead);
    let tbody = document.createElement("tbody");
    for (let i = 0; i < data.length; i++) {
        let tr = document.createElement("tr");
        let td1 = document.createElement("td");
        let td2 = document.createElement("td");
        td1.innerHTML = data[i]["Counter"];
        td2.innerHTML = data[i]["page"];
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    ranking.appendChild(table);
}
