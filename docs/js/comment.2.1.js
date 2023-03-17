const dcomPage = window.location.pathname;
const dcomSite = "https://darkgoldbar.github.io";
const dcomServer="https://27n4glpsqowyvyndhv4tltfoby0ovlty.lambda-url.ap-northeast-3.on.aws/";


window.addEventListener('load', dcomInit);


function dcomInit() {
    const dcomEle = document.getElementById('d-comment');
    const dcomVCEle = document.getElementById('d-counter');
    dcomEle.innerHTML = `
    <form action="#">
        <div class="flex">
            <input type="text" name="nickname" placeholder="昵称" required>
            <input type="email" name="email" placeholder="邮箱">
        </div>
        <div class="flex">
            <textarea name="comment" rows="5" placeholder="请输入评论" required></textarea>
        </div>
        <div>
            <input class="button" type="submit" value="提交评论">
        </div>
        <sub>Powered by <a href="https://github.com/DarkGoldBar">D-comment</a></sub>
    </form>
    <hr>
    <div class="comments"></div>
    <a class="button" type="more-comment">加载更多</a>
    <p class="comment-nomore" hide>没有更多评论了</p>
    `;

    const moreEle = document.querySelector('#d-comment [type=more-comment]');
    const formEle = document.querySelector('#d-comment form');
    moreEle.addEventListener('click', dcomGetMore);
    formEle.addEventListener('submit', (event) => {
        event.preventDefault();
        dcomPost(true);
    });
    if (!(dcomSite) || (window.location.origin == dcomSite)) {
        if (dcomEle) {
            dcomGet();
        }
        if (dcomVCEle)  {
            dcomVC();
        }
    }
}

function dcomVCRender(count, timestamp) {
    const vcNode = document.getElementById('d-counter');
    const date = new Date(timestamp * 1000);
    const dateString = date.toLocaleString();
    vcNode.innerHTML = `浏览次数: ${count} 最后访问: ${dateString}`
}

function dcomRenderComment(commentDict) {
    let { comment, nickname, cid, timestamp, email } = commentDict;
    const date = new Date(timestamp * 1000);
    const dateString = date.toLocaleString();
    email = email || '';

    const html = `
      <div class="comment" data-cid="${cid}">
        <div class="comment-name">${nickname}</div>
        <div class="comment-info">
          <span class="comment-time">${dateString}</span>
          <span class="comment-email">${email}</span>
        </div>
        <div class="comment-body">${comment}</div>
      </div>
    `;
    return html;
}

function dcomRenderCommentList(commentList, noMore=False) {
    const commentsEle = document.querySelector('#d-comment .comments');
    const MoreEle = document.querySelector('#d-comment [type=more-comment]');
    const noMoreEle = document.querySelector('#d-comment .comment-nomore');
    let newEle = null;
    commentList.forEach(c => {
        newEle = document.createElement('div');
        newEle.innerHTML = dcomRenderComment(c);
        commentsEle.appendChild(newEle.children[0]);
    });

    if (noMore) {
        noMoreEle.removeAttribute('hide');
        MoreEle.setAttribute('hide', '');
    }
}

function dcomGetMore() {
    // chatGPT: 写一个JS函数，从下面的.comments元素中，找到最小的data-cid值
    const comments = document.querySelectorAll('#d-comment .comments .comment');
    let minCid = Infinity;
    for (let i = 0; i < comments.length; i++) {
        const cid = parseInt(comments[i].getAttribute('data-cid'));
        if (!isNaN(cid) && cid < minCid) {
            minCid = cid;
        }
    }
    minCid = (minCid == Infinity) ? null : minCid;
    dcomGet(minCid);
}

function dcomGet(offset=null, limit=10, page=dcomPage) {
    const xhr = new XMLHttpRequest();
    let query = `?limit=${limit}`;
    if (offset) {
        query += `&offset=${offset}`;
    }

    xhr.onload = function () {
        if (xhr.status === 200) {
            let commentList = JSON.parse(xhr.responseText);
            dcomRenderCommentList(commentList, (commentList.length < limit));
        } else {
            console.log("d-comment:", xhr.responseText);
        }
    };

    xhr.open("GET", dcomServer + query, true);
    xhr.setRequestHeader("x-referer-page", page);
    xhr.send();
}

function dcomPost(doRefresh=false, page=dcomPage) {
    const xhr = new XMLHttpRequest();
    const nickname = document.querySelector("#d-comment [name=nickname]").value;
    const email = document.querySelector("#d-comment [name=email]").value;
    const comment = document.querySelector("#d-comment [name=comment]").value;

    // 监听请求完成事件
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log("d-comment:", xhr.responseText);
            if (doRefresh) { location.reload() }
        } else {
            console.log("d-comment:", xhr.responseText);
            alert("评论提交失败");
        }
    };

    xhr.open("POST", dcomServer, true);
    xhr.setRequestHeader("x-referer-page", page);
    xhr.send(JSON.stringify({ nickname, email, comment }));
}

function dcomVC() {
    const cookieKey = 'dcom:visited:' + CurrentPage;
    const currentTimeStamp = new Date().getTime();
    const lastTimeStamp = new Number(localStorage.getItem(cookieKey));
    localStorage.setItem(cookieKey, currentTimeStamp);

    const doUpdate = !(lastTimeStamp && ((currentTimeStamp - lastTimeStamp) < 86400000));
    dcomVCRequest(doUpdate);
}

function dcomVCRequest(doUpdate=false, page=dcomPage) {
    const xhr = new XMLHttpRequest();
    const query = "?action=" + (doUpdate ? "VCUpdate" : "VCGet");
    xhr.responseType = 'json';

    xhr.onload = function() {
        let { Counter, LastVisit } = this.response
        dcomVCRender(Counter, LastVisit);
    };

    xhr.open("GET", dcomServer + query);
    xhr.setRequestHeader("x-referer-page", page);
    xhr.send();
}
