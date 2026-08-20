var dcomPage = window.location.origin + window.location.pathname;
var dcomSite = "https://darkgoldbar.github.io";
var dcomServer = "https://o3cx4bmlod.execute-api.ap-northeast-1.amazonaws.com/Prod/";


window.addEventListener('load', dcomInit);


function dcomInit() {
    const dcomEle = document.getElementById('d-comment');
    const dcomVCEle = document.getElementById('d-counter');
    if (!dcomEle) {
        return;
    }

    dcomEle.innerHTML = `
    <form action="#">
        <div class="flex">
            <input type="text" name="nickname" placeholder="昵称(必填)" required>
        </div>
        <div class="flex">
            <textarea name="comment" rows="5" placeholder="请输入评论..." required></textarea>
        </div>
        <div>
            <input class="button" type="submit" value="提交评论">
        </div>
        <sub>Powered by <a href="https://darkgoldbar.github.io/posts/code/create-a-severless-blog-comment-system/">D-comment</a></sub>
    </form>
    <hr>
    <div class="comments"></div>
    <a class="button" type="more-comment">加载更多</a>
    <p class="comment-nomore" hide>没有更多评论了</p>
    `;

    const moreEle = dcomEle.querySelector('[type=more-comment]');
    const formEle = dcomEle.querySelector('form');
    moreEle.addEventListener('click', dcomGetMore);
    formEle.addEventListener('submit', (event) => {
        event.preventDefault();
        dcomPost(true);
    });
    if (!(dcomSite) || (window.location.origin === dcomSite)) {
        dcomGet();
        if (dcomVCEle)  {
            dcomVC();
        }
    }
}

function dcomVCRender(count, timestamp) {
    const vcNode = document.getElementById('d-counter');
    if (!vcNode) {
        return;
    }

    vcNode.replaceChildren();
    const icon = document.createElement('i');
    icon.className = 'far fa-eye fa-fw';
    icon.setAttribute('aria-hidden', 'true');
    vcNode.appendChild(icon);
    vcNode.appendChild(document.createTextNode(' 浏览次数: ' + count));
    if (timestamp) {
        vcNode.appendChild(document.createTextNode(' 最后访问: ' + new Date(timestamp * 1000).toLocaleString()));
    }
}

function dcomRenderComment(commentDict) {
    const comment = document.createElement('div');
    const name = document.createElement('div');
    const info = document.createElement('div');
    const time = document.createElement('span');
    const body = document.createElement('div');

    comment.className = 'comment';
    comment.dataset.cid = commentDict.message_id;
    name.className = 'comment-name';
    name.textContent = commentDict.nickname || commentDict.author || '匿名';
    info.className = 'comment-info';
    time.className = 'comment-time';
    time.textContent = new Date(commentDict.created_at * 1000).toLocaleString();
    body.className = 'comment-body';
    body.textContent = commentDict.comment || commentDict.content || '';

    info.appendChild(time);
    comment.appendChild(name);
    comment.appendChild(info);
    comment.appendChild(body);
    return comment;
}

function dcomRenderCommentList(commentList, noMore) {
    const commentsEle = document.querySelector('#d-comment .comments');
    const MoreEle = document.querySelector('#d-comment [type=more-comment]');
    const noMoreEle = document.querySelector('#d-comment .comment-nomore');
    commentList.forEach(function (comment) {
        commentsEle.appendChild(dcomRenderComment(comment));
    });

    if (noMore) {
        noMoreEle.removeAttribute('hide');
        MoreEle.setAttribute('hide', '');
    }
}

function dcomGetMore() {
    dcomRenderCommentList([], true);
}

function dcomGet() {
    const url = new URL('comments', dcomServer);
    url.searchParams.set('url', dcomPage);
    url.searchParams.set('limit', '100');

    fetch(url)
        .then(function (response) {
            if (!response.ok) {
                throw new Error(response.status);
            }
            return response.json();
        })
        .then(function (data) {
            dcomRenderCommentList(data.comments || [], true);
        })
        .catch(function (error) {
            console.log('d-comment:', error);
        });
}

function dcomPost(doRefresh) {
    const nickname = document.querySelector("#d-comment [name=nickname]").value;
    const comment = document.querySelector("#d-comment [name=comment]").value;

    fetch(new URL('comments', dcomServer), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: dcomPage, nickname: nickname, comment: comment })
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error(response.status);
            }
            return response.json();
        })
        .then(function () {
            if (doRefresh) { location.reload() }
        })
        .catch(function (error) {
            console.log('d-comment:', error);
            alert("评论提交失败");
        });
}

function dcomVC() {
    const cookieKey = 'dcom:visited:' + dcomPage;
    const currentTimeStamp = new Date().getTime();
    const lastTimeStamp = new Number(localStorage.getItem(cookieKey));
    localStorage.setItem(cookieKey, currentTimeStamp);

    const doUpdate = !(lastTimeStamp && ((currentTimeStamp - lastTimeStamp) < 86400000));
    dcomVCRequest(doUpdate);
}

function dcomVCRequest(doUpdate) {
    const url = new URL('visit', dcomServer);
    const options = doUpdate
        ? {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ url: dcomPage })
        }
        : { method: 'GET' };

    if (!doUpdate) {
        url.searchParams.set('url', dcomPage);
    }

    fetch(url, options)
        .then(function (response) {
            if (!response.ok) {
                throw new Error(response.status);
            }
            return response.json();
        })
        .then(function (data) {
            dcomVCRender(data.visit_count, data.item && data.item.updated_at);
        })
        .catch(function (error) {
            console.log('d-comment:', error);
        });
}
