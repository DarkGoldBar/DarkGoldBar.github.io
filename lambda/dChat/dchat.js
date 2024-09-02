const apiURL = "wss://fxyfyu1ivj.execute-api.ap-northeast-1.amazonaws.com/Prod";
const pagePath = "chatroom";
const roomId = "123";
const userList = document.getElementById('user-list');
const currentUser = getIdentify();
const socket = new WebSocket(`${apiURL}?uuid=${currentUser.uuid}&page_path=${pagePath}&room_id=${roomId}&nickname=${currentUser.nickname}`);
let users = [];

console.log('UUID:', currentUser.uuid);
console.log('Nickname:', currentUser.nickname);

socket.onopen = function(event) {
    console.log("Connected to WebSocket API");
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            action: 'full_data_request',
            page_path: pagePath,
            room_id: roomId,
        }));
    }
};

socket.onmessage = function(event) {
    const messageData = JSON.parse(event.data);
    console.log(messageData);

    switch (messageData.type) {
        case 'leave':
            handleLeaveMessage(messageData);
            break;
        case 'join':
            handleJoinMessage(messageData);
            break;
        case 'text':
            handleTextMessage(messageData);
            break;
        case 'disconnect':
            handleDisconnectMessage(messageData);
            break;
        case 'fullDataResponse':
            handleFullDataResponse(messageData);
            break;
        default:
            console.warn('Unknown message type:', messageData.type);
    }
};

socket.onclose = function(event) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            action: 'before_disconnect',
            type: 'disconnecting',
            reason: 'Client is closing connection',
            page_path: pagePath,
            room_id: roomId,
        }));
    }
    console.log("Disconnected from WebSocket API");
};

window.addEventListener("beforeunload", function() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            action: 'before_disconnect',
            type: 'disconnecting',
            reason: 'Client is closing connection',
            page_path: pagePath,
            room_id: roomId,
        }));
    }
});

window.onload = function() {
    updateUserList();
};

// 处理用户离开
// {type: 'leave', uuids: ['36653049-985e-4918-8ebc-ae21e67745cc'], timestamp: 1725279267}
function handleLeaveMessage(messageData) {
    const uuidsToRemove = messageData.uuids;
    users = users.filter(user => !uuidsToRemove.includes(user.uuid));
    updateUserList();
}

// 处理用户加入
// {type: 'join', uuid: '36653049-985e-4918-8ebc-ae21e67745cc', nickname: '36653049', timestamp: 1725279280}
function handleJoinMessage(messageData) {
    const newUser = {
        uuid: messageData.uuid,
        nickname: messageData.nickname
    };

    const userExists = users.some(user => user.uuid === newUser.uuid);

    if (!userExists) {
        users.push(newUser);
        updateUserList();
    }
}

// 处理文本消息
// {type: 'text', uuid: '627d7a3c-0953-4dd8-87b5-9fe99238380a', nickname: '627d7a3c', message: 'asdf', timestamp: 1725279574}
function handleTextMessage(messageData) {
    displayMessage(
        messageData.message, 
        messageData.nickname, 
        messageData.timestamp, 
        messageData.uuid === currentUser.uuid
    );
}

// 处理文本消息
// {'type': 'fullDataResponse', 'users': [{'uuid': conn['UUID'], 'nickname': conn['Nickname']}], 'messages': msessages}
function handleFullDataResponse(data) {
    // 更新用户列表
    users = data.users;
    updateUserList();

    // 更新消息界面
    const maxTimestamp = getMaxTimestamp();
    const messages = data.messages;
    messages.forEach(messageJson => {
        messageData = JSON.parse(messageJson)
        if (messageData.timestamp > maxTimestamp) {
            displayMessage(
                messageData.message, 
                messageData.nickname, 
                messageData.timestamp, 
                messageData.uuid === currentUser.uuid
            );
        }
    });
}

// 服务器断开连接
// {'type': 'disconnect', 'reason': 'Duplicate UUID detected'}
function handleDisconnectMessage(messageData) {
    const overlay = document.createElement('div');
    overlay.classList.add('fullScreamDialogOverlay');

    const dialog = document.createElement('div');
    dialog.classList.add('fullScreamDialog');

    const title = document.createElement('h2');
    title.textContent = 'Connection Closed';
    dialog.appendChild(title);

    const message = document.createElement('p');
    message.textContent = `服务器关闭连接.\nReason: ${messageData.reason}`;
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


function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if (message) {
        socket.send(JSON.stringify({
            message: message,
            page_path: pagePath,
            room_id: roomId
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

function getIdentify() {
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${d.toUTCString()}`;
        document.cookie = `${name}=${value}; ${expires}; path=/`;
    }

    let uuid = getCookie('uuid');
    let nickname = getCookie('nickname');

    if (uuid && nickname) {
        return { uuid, nickname };
    } else {
        uuid = generateUUID();
        nickname = uuid.substring(0, 8);

        setCookie('uuid', uuid, 365);
        setCookie('nickname', nickname, 365);

        return { uuid, nickname };
    }
}

function updateUserList() {
    userList.innerHTML = '';
    
    if (currentUser) {
        const currentUserItem = document.createElement('div');
        currentUserItem.textContent = currentUser.nickname;
        currentUserItem.className = 'user-item self';
        currentUserItem.title = currentUser.uuid;
        userList.appendChild(currentUserItem);
    }
    
    users.forEach(user => {
        if (user.uuid !== currentUser?.uuid) {
            const userItem = document.createElement('div');
            userItem.textContent = user.nickname;
            userItem.className = 'user-item';
            userItem.title = user.uuid;
            userList.appendChild(userItem);
        }
    });
}


function getMaxTimestamp() {
    const messagesDiv = document.getElementById('messages');
    const messageContainers = messagesDiv.getElementsByClassName('message');
    
    let maxTimestamp = -Infinity; // 初始化为负无穷，确保可以找到最大的值
    
    for (const messageContainer of messageContainers) {
        const timestamp = parseInt(messageContainer.getAttribute('data-timestamp'), 10);
        if (timestamp > maxTimestamp) {
            maxTimestamp = timestamp;
        }
    }

    return maxTimestamp;
}
