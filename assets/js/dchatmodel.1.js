class DchatClient {
    constructor(apiURL, page_path, room_id="123") {
        this.member = {
            uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
            nickname: 'nickname',
            online: 1,
            position: 0
        }
        this.room = {
            page_path: page_path,
            room_id: room_id,
            members: [this.member],
            messages: [],
        }
        this.handler = null;
        this.apiURL = apiURL
    }

    login(uuid, nickname, position) {
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

        const urlParams = new URLSearchParams(window.location.search);
        if (!uuid) { uuid = getCookie("uuid"); }
        if (!uuid) { uuid = generateUUID(); }
        if (!nickname) { nickname = getCookie("nickname"); }
        if (!nickname) { nickname = uuid.substring(0, 8); }
        if (!position) { position = 0; }    
        setCookie("uuid", uuid, 365);
        setCookie("nickname", nickname, 365);
        this.member.uuid = uuid;
        this.member.nickname = nickname;
        this.member.position = position;
    }

    connect() {
        const urlParams = new URLSearchParams(window.location.search);
        const page_path = urlParams.get('page_path');
        const room_id = urlParams.get('room_id');
    
        if (page_path && room_id) {
            this.room.page_path = page_path;
            this.room.room_id = room_id;
        }

        const url = `${this.apiURL}?&page_path=${this.room.page_path}&room_id=${this.room.room_id}&uuid=${this.member.uuid}&nickname=${this.member.nickname}&position=${this.member.position}`
        this.handler = new WebSocketHandler(url);
    }

    send(data) {
        this.handler.socket.send(data);
    }

    close() {
        this.handler.socket.close();
    }
}


class WebSocketHandler {
    constructor(url) {
        const socket = new WebSocket(url);
        this.socket = socket;
        socket.send

        this.socket.onopen = function(event) {
            console.log("Connected to WebSocket API");
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: 'reload' }));
            }
        }

        this.socket.onmessage = (event) => {
            this.handleMessage(event);
        }

        this.socket.onclose = function(event) {
            console.log("Disconnected from WebSocket API");
        }
    }

    messageHandlers = {
        warning: this.handleWarningMessage,
    };

    handleMessage(event) {
        const message = JSON.parse(event.data);
        console.log(message);

        if (this.messageHandlers[message.msgtype]) {
            this.messageHandlers[message.msgtype](message);
        } else {
            console.warn('Unknown message type:', message.msgtype);
        }
    }

    setMessageHandler(msgtype, handler) {
        this.messageHandlers[msgtype] = handler;
    }

    removeMessageHandler(msgtype) {
        if (this.messageHandlers[msgtype]) {
            delete this.messageHandlers[msgtype];
        } else {
            console.warn('No handler found for message type:', msgtype);
        }
    }

    handleWarningMessage(message) {
        createAlert(message.message);
    }
}


function createAlert(message) {
    let alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.setAttribute('id', 'alert-container');
        document.body.appendChild(alertContainer);
    }

    const alertBox = document.createElement('div');
    alertBox.classList.add('alert-box');

    const alertCont = document.createElement('div');
    alertCont.classList.add('content');

    const alertMessage = document.createElement('p');
    alertMessage.innerText = message;

    const closeButton = document.createElement('button');
    closeButton.classList.add('close-btn');
    closeButton.innerText = 'X';
    closeButton.onclick = function() {
        closeAlert(alertBox);
    };

    alertCont.appendChild(alertMessage);
    alertCont.appendChild(closeButton);
    alertBox.appendChild(alertCont);
    alertContainer.appendChild(alertBox);

    setTimeout(() => {
        alertBox.classList.add('show');
    }, 100); // Small delay to trigger transition

    setTimeout(() => {
        closeAlert(alertBox);
    }, 5000); // Auto close after 5 seconds
}


function closeAlert(alertBox) {
    alertBox.classList.add('fade-out');
    setTimeout(() => {
        alertBox.remove();
    }, 600); // Delay to allow the transition to complete before removing
}
