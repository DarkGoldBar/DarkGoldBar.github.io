const cnameSite = "https://DarkGoldbar.github.io";
const cnameServer = "https://oz7pnirp6vyjlcqsd7qln3feqe0pjrlq.lambda-url.ap-northeast-3.on.aws/";

const url = new URL(window.location.href);
const cnameNo = url.searchParams.get('no');
const cnameRole = url.searchParams.get('role');
const cnameColor = url.searchParams.get('c');
const cnameCardList = document.getElementsByClassName('card');
const cnameCardRoot = document.getElementById('container-card');
const cnameConsts = {
    Leader: "leader",
    Member: "member",
    Gray: 0,
    Red: 1,
    Blue: 2,
    Black: 4,
    0: "card-gray",
    1: "card-red",
    2: "card-blue",
    4: "card-black"
}
var cnameData = {};

window.addEventListener('load', cnameInit);

function cnameInit() {
    const copyButton = document.querySelector("#game-link button");
    let e, element;

    if (cnameNo) {
        document.getElementById('section-welcome').toggleAttribute('hidden', true);
        document.getElementById('section-gaming').removeAttribute('hidden');
        cnameSync();
    }

    for (element of cnameCardList) {
        element.addEventListener("click", function () {
            if (this.hasAttribute('disabled')) {
                return;
            }
            cnameClearSelect();
            this.classList.add('card-rainbow');
            cnameCardRoot.setAttribute('data-card', this.getAttribute('data-card'));
        });
    };

    if ((cnameNo) && (cnameRole)){
        document.getElementById('game-echo').innerText = capitalizeFirstLetter(cnameColor) + capitalizeFirstLetter(cnameRole) + cnameNo;
    }

    document.getElementById('game-create').addEventListener("click", function () {
        if (this.hasAttribute('disabled')) {
            return false
        }
        this.toggleAttribute('disabled', true);
        cnameCreate();
    });

    document.getElementById('game-update').addEventListener("click", () => {
        cnameSync();
    });

    document.getElementById('game-pick').addEventListener("click", () => {
        document.getElementById('game-change').toggleAttribute('hidden', true);
        cnameCardCommand('pick');
    });

    document.getElementById('game-change').addEventListener("click", () => {
        cnameCardCommand('change');
    });

    copyButton.addEventListener("click", () => {
        // 创建临时textarea元素并将文本内容复制到其中
        const tempTextarea = document.createElement("textarea");
        const textToCopy = document.getElementById("game-link").innerText;
        tempTextarea.value = textToCopy;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextarea);

        // 修改复制按钮文本
        copyButton.innerText = "已复制";
        copyButton.toggleAttribute('disable', true);
        setTimeout(() => {
            copyButton.innerText = "复制链接";
            copyButton.removeAttribute('disable');
        }, 2000);
    });
}


// 渲染网页
function cnameRender() {
    let element, i, cls;
    const remain = cnameGetRemain();
    const updateButton = document.getElementById('game-update');
    if ((cnameData.chosen) && (cnameData.chosen.length > 0)) {
        document.getElementById('game-change').toggleAttribute('hidden', true);
    }
    for (i = 0; i < 25; i++) {
        element = cnameCardList[i];
        element.querySelector('p').innerText = cnameData.text[i];
        if ((cnameRole == cnameConsts.Leader) || (cnameData.chosen.indexOf(i) > -1)) {
            cls = cnameConsts[cnameData.color[i]];
            if (cls) {
                element.classList.add(cls);
            }
        }
        if (cnameData.chosen.indexOf(i) > -1) {
            element.toggleAttribute('disabled', true);
        }
    }
    document.querySelector('#red-score span').innerText = remain.red;
    document.querySelector('#blue-score span').innerText = remain.blue;

    updateButton.toggleAttribute('disabled', true);
    setTimeout(() => {
        updateButton.removeAttribute('disabled');
    }, 3000);
}

// XHR
function cnameCardCommand(action) {
    // action = "change" | "pick"
    const xhr = new XMLHttpRequest();
    const query = `?no=${cnameNo}&action=${action}`;
    const card = cnameGetCard();
    cnameClearSelect();
    if (card === false) {
        return;
    }

    xhr.responseType = 'json';
    xhr.onload = function () {
        if (xhr.status === 200) {
            if (this.response.success) {
                cnameSync();
            } else {
                alert('request failed.' + this.response.failed);
            }
        } else {
            alert('request failed.' + xhr.response);
        }
    }
    xhr.open("POST", cnameServer + query, true);
    xhr.send(JSON.stringify({ card }));
}

function cnameCreate() {
    const xhr = new XMLHttpRequest();
    const query = `?no=${cnameNo}&action=create`;

    xhr.responseType = 'json';
    xhr.onload = function () {
        if (xhr.status === 200) {
            alert('create complete');
            cnameJoin(xhr.response.no);
        } else {
            alert('request failed.' + xhr.response);
        }
    }
    xhr.open("POST", cnameServer + query, true);
    xhr.send();
}

function cnameSync() {
    const xhr = new XMLHttpRequest();
    const query = `?no=${cnameNo}&action=sync`;

    xhr.responseType = 'json';
    xhr.onload = function () {
        if (xhr.status === 200) {
            cnameData = this.response;
            cnameRender();
        } else {
            alert('request failed.' + xhr.response);
        }
    }
    xhr.open("POST", cnameServer + query, true);
    xhr.send();
}

// 本地逻辑
function cnameGetRemain() {
    const resp = { red: 0, blue: 0};
    for (let i=0; i<25; i++) {
        if (cnameData.chosen.indexOf(i) == -1) {
            if (cnameData.color[i] == cnameConsts.Red) {
                resp.red += 1;
            } else if (cnameData.color[i] == cnameConsts.Blue) {
                resp.blue += 1;
            }
        }
    }
    return resp
}

function cnameGetCard() {
    const card = parseInt(cnameCardRoot.getAttribute('data-card'));
    if ((!card) || (card < 0) || (card > 25)) {
        alert('卡片选择错误:' + card);
        return false;
    }
    return card - 1;
}

function cnameClearSelect() {
    for (e of cnameCardList) {
        e.classList.remove('card-rainbow');
    };
    cnameCardRoot.setAttribute('data-card', '');
}

function cnameJoin(number = null) {
    const page = window.location.origin + window.location.pathname;
    let e, href;

    if (number === null) {
        number = document.getElementById("game-number").value;
    }
    document.querySelectorAll("#game-link p").forEach(element => {
        href = `${page}?no=${number}&` + element.getAttribute("data-query");
        e = element.querySelector('a');
        e.setAttribute('href', href);
        e.innerText = href;
    })
    document.querySelector('#game-link').parentNode.removeAttribute('hidden');
}


function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}