const apiURL = "wss://fxyfyu1ivj.execute-api.ap-northeast-1.amazonaws.com/Prod";
const dchat = new DchatClient(apiURL);

updateUserList();

dchat.handler.setMessageHandler('leave', (messageData) => {
    dchat.room.members = dchat.room.members.filter(mem => (!(mem.uuid == messageData.uuid)));
    updateUserList();
});

dchat.handler.setMessageHandler('join', (messageData) => {
    const new_member = {
        uuid: messageData.uuid,
        nickname: messageData.nickname,
        online: 1,
        position: messageData.position,
    }
    const existFlag = dchat.room.members.some(m => m.uuid === new_member.uuid);
    if (!existFlag) {
        dchat.room.members.push(new_member);
        updateUserList();
    }
});

dchat.handler.setMessageHandler('text', (messageData) => {
    dchat.room.messages.push(messageData)
    displayMessage(
        messageData.text, 
        messageData.nickname, 
        messageData.timestamp, 
        messageData.uuid === dchat.member.uuid
    );
});

dchat.handler.setMessageHandler('reload', (messageData) => {
    let msg;
    dchat.room.members = messageData.members;
    dchat.room.messages = messageData.messages;
    dchat.room.messages.forEach(messageJson => {
        msg = JSON.parse(messageJson)
        displayMessage(
            msg.text, 
            msg.nickname, 
            msg.timestamp, 
            msg.uuid === dchat.member.uuid,
        );
    });
    updateUserList();
});

dchat.handler.setMessageHandler('disconnect', (messageData) => {
    displayFullScreamDialog("服务器关闭连接", `原因: ${messageData.reason}`)
});


function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const text = messageInput.value;
    if (text) {
        dchat.send(JSON.stringify({
            text: text,
        }));
        messageInput.value = '';
    }
}


function displayMessage(message, nickname, timestamp, isOwn = false) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');
    if (isOwn) {
        messageContainer.classList.add('own-message');
    }

    messageContainer.setAttribute('data-timestamp', timestamp);

    const nicknameElement = document.createElement('span');
    nicknameElement.classList.add('nickname');
    nicknameElement.textContent = nickname;

    const messageElement = document.createElement('p');
    messageElement.classList.add('message-text');
    messageElement.textContent = message;

    messageContainer.appendChild(nicknameElement);
    messageContainer.appendChild(messageElement);

    const messagesDiv = document.getElementById('messages');
    messagesDiv.appendChild(messageContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


function displayFullScreamDialog(title, note) {
    const overlay = document.createElement('div');
    overlay.classList.add('fullScreamDialogOverlay');

    const dialog = document.createElement('div');
    dialog.classList.add('fullScreamDialog');

    const titleEle = document.createElement('h2');
    titleEle.textContent = title;
    dialog.appendChild(title);

    const message = document.createElement('p');
    message.textContent = note;
    dialog.appendChild(message);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'OK';
    closeButton.classList.add('close-button');

    closeButton.onclick = function() {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
    };

    dialog.appendChild(closeButton);

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
}


function createMemberElement(member) {
    const ele = document.createElement('div');
    ele.className = 'user-item';
    ele.textContent = member.nickname;
    ele.title = member.uuid;
    if (member.position !== 0) {
        const posEle = document.createElement("span");
        posEle.className = "position";
        posEle.textContent = member.position;
        ele.appendChild(posEle);
    }
    return ele
}


function updateUserList() {
    const memberList = document.getElementById('user-list');
    let ele;
    memberList.innerHTML = '';
    
    const selfEle = createMemberElement(dchat.member);
    selfEle.classList.add("self")
    memberList.appendChild(selfEle);
    
    dchat.room.members.forEach(mem => {
        if (mem.uuid !== dchat.member.uuid) {
            ele = createMemberElement(mem);
            memberList.appendChild(ele);
        }
    });
}
