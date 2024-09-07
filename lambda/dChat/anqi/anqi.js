const currentUser = getIdentify();
const apiURL = "wss://fxyfyu1ivj.execute-api.ap-northeast-1.amazonaws.com/Prod";
const pagePath = "anqi";
const url = new URL(window.location.href);
const roomId = url.searchParams.get("room_id");
const socket = new WebSocket(`${apiURL}?uuid=${currentUser.uuid}&page_path=${pagePath}&room_id=${roomId}&nickname=${currentUser.nickname}&position=${currentUser.position}`);

const exampleData = [
    [0, 1], [13, 1], [5, 1], [10, 1], [2, 0], [8, 1], [3, 0], [-1, -1],
    [1, 0], [5, 0], [12, 1], [6, 0], [6, 0], [2, 1], [6, 0], [5, 1],
    [1, 0], [8, 0], [8, 0], [9, 0], [9, 0], [11, 1], [10, 0], [11, 0],
    [2, 0], [3, 1], [2, 1], [9, 1], [-1, -1], [13, 0], [13, 0], [-1, -1]
];

const gamestate = {
    board: exampleData,
    turn_player: 0,
    gameover: 0
};

const exampleUsers = [
    {uuid: "11111111-xxxx-xxxx-xxxx-12345678abcd", position: 1, nickname: "YourNickName"},
    {uuid: "22222222-xxxx-xxxx-xxxx-12345678abcd", position: 2, nickname: "name2"},
    {uuid: "33333333-xxxx-xxxx-xxxx-12345678abcd", position: 0, nickname: "name3"},
];

var users = exampleUsers;
console.log("UUID:", currentUser.uuid);
console.log("Nickname:", currentUser.nickname);

updateGame();
updateUserList();

const cancelButton = document.querySelector("#cancel-button");
cancelButton.disabled = true;
cancelButton.addEventListener("click", function() {
    clearBoardHighlights();
    cancelButton.disabled = true; // 取消按钮被点击后设为不可用
});


function updateGame() {
    generateBoard(gamestate.board);

    const turnPlayerDiv = document.getElementById("turn-player");
    const turnPlayerSpan = turnPlayerDiv.getElementsByTagName("span");
    turnPlayerSpan.innerHTML = gamestate.turn_player;

    const gameoverDiv = document.getElementById("gameover");
    if (gamestate.gameover === 1) {
        gameoverDiv.style.display = "none";
    } else {
        gameoverDiv.style.display = "block";
    }
}


function generateBoard(boardData) {
    const board = document.getElementById("board");
    board.innerHTML = ""; // 清空现有内容

    boardData.forEach((item, index) => {
        const chessContainer = document.createElement("div");
        chessContainer.className = "chess-container";
        chessContainer.setAttribute("data-id", index);
        
        const chess = document.createElement("div");
        chess.className = "chess";

        // 根据数据来决定棋子的状态
        if (item[0] === -1 && item[1] === -1) {
            ; // 空位
        } else if (item[1] === 0) {
            chess.classList.add("back");
            chess.addEventListener("click", function() {
                handlePieceClick(index);
            });
        } else {
            chess.textContent = getPieceName(item[0]);
            chess.classList.add(item[0] < 7 ? "red-piece" : "black-piece");
            chess.addEventListener("click", function() {
                handlePieceClick(index);
            });
        }

        chessContainer.appendChild(chess);
        board.appendChild(chessContainer);
    });
}

function handlePieceClick(index) {
    const pieceData = gamestate["board"][index];
    const pieceType = pieceData[0];
    const flipped = pieceData[1];

    clearBoardHighlights();
    cancelButton.disabled = false;

    if (flipped === 0) {
        // 未翻开的棋子，合法目标是它自身的位置
        setupHighlight(index, index);
    } else if (flipped === 1 && pieceType !== 5 && pieceType !== 12) { 
        // 翻开的棋子，不是炮
        const potentialMoves = [index - 8, index + 8, index - 1, index + 1];
        potentialMoves.forEach(toIndex => {
            if (checkValidMove(index, toIndex)) {
                setupHighlight(index, toIndex);
            }
        });
    } else if (flipped === 1 && (pieceType === 5 || pieceType === 12)) {
        // 翻开的棋子是炮，检查上下左右任意格
        checkValidPaoMove(index, -8); // Up
        checkValidPaoMove(index, 8);  // Down
        checkValidPaoMove(index, -1); // Left
        checkValidPaoMove(index, 1);  // Right
    }
}


function checkValidPaoMove(fromIndex, step) {
    let toIndex = fromIndex + step;
    let i = 1;
    let mounts = 0;
    while (toIndex >= 0 && toIndex < 32) {
        if (gamestate.board[toIndex][0] === -1) {
            if (i === 1) {
                setupHighlight(fromIndex, toIndex);
            };
        } else { 
            mounts = 0;
            for (let j=1; j<i; j++) {
                if (!(gamestate.board[fromIndex + j * step][0] === -1)) {
                    mounts += 1;
                }
            }
            if (mounts === 1) {
                if (gamestate.board[toIndex][1] === 0) {
                    setupHighlight(fromIndex, toIndex);
                } else if (((gamestate.board[fromIndex][0] < 7) ^ (gamestate.board[toIndex][0] < 7))) {
                    setupHighlight(fromIndex, toIndex);
                }
            } else if (mounts > 1){
                return;
            }
        }
        if ((toIndex % 8 === 0) || (toIndex % 8 === 7)) {
            return;
        }
        i += 1;
        toIndex += step;
    }
}

function checkValidMove(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= 32) {
        return false;
    }
    let st = gamestate.board[fromIndex][0];
    let et = gamestate.board[toIndex][0];
    if (et === -1) { // 目标为空
        return true;
    } else if (gamestate.board[toIndex][1] === 0) { // 目标未翻开
        return false;
    } else if (!((st < 7) ^ (et < 7))) { // 同色
        return false;
    }
    st = st % 7;
    et = et % 7;
    if ((st == 6) && (et == 0)) {
        return true;
    } else if ((st == 0) && (et == 6)){
        return false;
    } else if (st <= et){
        return true;
    }
    return false;
}

function setupHighlight(fromIndex, toIndex) {
    const chess = document.querySelector(`#board [data-id="${toIndex}"]`);
    if (chess) {
        const highlight = document.createElement("div");
        highlight.className = "highlight";
        chess.appendChild(highlight);
        highlight.addEventListener("click", function moveHandler() {
            clearBoardHighlights();
            sendMoveToServer(fromIndex, toIndex); // 向服务器发送移动数据
            cancelButton.disabled = true;
        })
    }
}

function sendMoveToServer(fromIndex, toIndex) {
    console.log(`Move from ${fromIndex} to ${toIndex}`);
    // 实现向服务器发送数据的逻辑
}

function clearBoardHighlights() {
    document.querySelectorAll("#board .highlight").forEach(highlight => {
        highlight.remove();
    });
    cancelButton.disabled = true;
}

function getPieceName(type) {
    const pieceNames = ["将", "士", "象", "车", "马", "炮", "兵", "帅", "仕", "相", "车", "马", "炮", "卒"];
    return pieceNames[type];
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // 交换元素
    }
    return array;
}



socket.onopen = function(event) {
    console.log("Connected to WebSocket API");
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            action: "full_data_request",
            page_path: pagePath,
            room_id: roomId,
        }));
    }
};


socket.onmessage = function(event) {
    const messageData = JSON.parse(event.data);
    console.log(messageData);

    switch (messageData.type) {
        case "leave":
            handleLeaveMessage(messageData);
            break;
        case "join":
            handleJoinMessage(messageData);
            break;
        case "disconnect":
            handleDisconnectMessage(messageData);
            break;
        case "fullDataResponse":
            handleFullDataResponse(messageData);
            break;
        default:
            console.warn("Unknown message type:", messageData.type);
    }
};

socket.onclose = function(event) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            action: "before_disconnect",
            type: "disconnecting",
            reason: "Client is closing connection",
            page_path: pagePath,
            room_id: roomId,
        }));
    }
    console.log("Disconnected from WebSocket API");
};

window.addEventListener("beforeunload", function() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            action: "before_disconnect",
            type: "disconnecting",
            reason: "Client is closing connection",
            page_path: pagePath,
            room_id: roomId,
        }));
    }
});

// 处理用户离开
// {type: "leave", uuids: ["36653049-985e-4918-8ebc-ae21e67745cc"], timestamp: 1725279267}
function handleLeaveMessage(messageData) {
    const uuidsToRemove = messageData.uuids;
    users = users.filter(user => !uuidsToRemove.includes(user.uuid));
    updateUserList();
}

// 处理用户加入
// {type: "join", uuid: "36653049-985e-4918-8ebc-ae21e67745cc", nickname: "36653049", timestamp: 1725279280}
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
// {type: "text", uuid: "627d7a3c-0953-4dd8-87b5-9fe99238380a", nickname: "627d7a3c", message: "asdf", timestamp: 1725279574}
function handleTextMessage(messageData) {
    displayMessage(
        messageData.message, 
        messageData.nickname, 
        messageData.timestamp, 
        messageData.uuid === currentUser.uuid
    );
}

// 处理文本消息
// {"type": "fullDataResponse", "users": [{"uuid": conn["UUID"], "nickname": conn["Nickname"]}], "messages": msessages}
function handleFullDataResponse(data) {
    // 更新用户列表
    users = data.users;
    updateUserList();

    // 检查 messages 的长度
    if (data.messages.length === 0) {
        // 向服务器发送 'reset' 操作
        const resetMessage = JSON.stringify({ action: 'reset' });
        socket.send(resetMessage);
    } else {
        // 处理接收到的消息
        const gs = JSON.parse(data.messages[0]);
        gamestate.board = gs.board;
        gamestate.turn_player = gs.turn_player;
        gamestate.gameover = gs.gameover;
        generateBoard();
    }
}


    if ((currentUser.position === 1) && (gamestate.turn_player === 0)) {
        socket.send(JSON.stringify({
            action: "reset",
            page_path: pagePath,
            room_id: roomId,
        }));
}

// 服务器断开连接
// {"type": "disconnect", "reason": "Duplicate UUID detected"}
function handleDisconnectMessage(messageData) {
    const overlay = document.createElement("div");
    overlay.classList.add("fullScreamDialogOverlay");

    const dialog = document.createElement("div");
    dialog.classList.add("fullScreamDialog");

    const title = document.createElement("h2");
    title.textContent = "Connection Closed";
    dialog.appendChild(title);

    const message = document.createElement("p");
    message.textContent = `服务器关闭连接.\nReason: ${messageData.reason}`;
    dialog.appendChild(message);

    const closeButton = document.createElement("button");
    closeButton.textContent = "OK";
    closeButton.classList.add("close-button");

    closeButton.onclick = function() {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
    };

    dialog.appendChild(closeButton);

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
}



function updateUserList() {
    function generateUserItem(user) {
        const userItem = document.createElement("div");
        if (user.position && user.position !== 0) {
            const positionSpan = document.createElement("span");
            positionSpan.className = "position";
            positionSpan.textContent = user.position;
            userItem.appendChild(positionSpan);
        }
        userItem.appendChild(document.createTextNode(user.nickname));
        userItem.className = "user-item";
        userItem.title = user.uuid;
        return userItem
    }

    const userList = document.getElementById("user-list");
    userList.innerHTML = "";

    if (currentUser) {
        const userItem = generateUserItem(currentUser)
        userItem.classList.add("self")
        userList.appendChild(userItem);
    }

    users.forEach(user => {
        if (user.uuid !== currentUser?.uuid) {
            const userItem = generateUserItem(user)
            userList.appendChild(userItem);
        }
    });
}


function getIdentify() {
    function generateUUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
    }

    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${d.toUTCString()}`;
        document.cookie = `${name}=${value}; ${expires}; path=/`;
    }

    const url = new URL(window.location.href);
    let uuid = url.searchParams.get(uuid);
    let nickname = url.searchParams.get(nickname);
    let position = url.searchParams.get(position);

    if (!uuid) { uuid = getCookie("uuid"); }
    if (!uuid) { uuid = generateUUID(); }
    if (!nickname) { nickname = getCookie("nickname"); }
    if (!nickname) { nickname = uuid.substring(0, 8); }
    if (!position) { position = 0; }

    setCookie("uuid", uuid, 365);
    setCookie("nickname", nickname, 365);
    return { uuid, nickname, position };
}
