const apiURL = "wss://fxyfyu1ivj.execute-api.ap-northeast-1.amazonaws.com/Prod";
const dchat = new DchatClient(apiURL, "anqi");
const urlParams = new URLSearchParams(window.location.search);

const exampleData = [
    [0, 1], [13, 1], [5, 1], [10, 1], [2, 0], [8, 1], [3, 0], [-1, -1],
    [1, 0], [5, 0], [12, 1], [6, 0], [6, 0], [2, 1], [6, 0], [5, 1],
    [1, 0], [8, 0], [8, 0], [9, 0], [9, 0], [11, 1], [10, 0], [11, 0],
    [2, 0], [3, 1], [2, 1], [9, 1], [-1, -1], [13, 0], [13, 0], [-1, -1]
];

const ZeroData = [
    [0, 0], [0, 0], [5, 0], [0, 0], [2, 0], [8, 0], [3, 0], [0, 0],
    [1, 0], [5, 0], [0, 0], [6, 0], [6, 0], [2, 0], [6, 0], [5, 0],
    [1, 0], [8, 0], [8, 0], [9, 0], [9, 0], [0, 0], [0, 0], [0, 0],
    [2, 0], [3, 0], [2, 0], [9, 0], [0, 0], [0, 0], [0, 0], [0, 0]
];

const gamestate = {
    board: ZeroData,
    turn_position: 0,
    gameover: 0,
    cols: 4,
};

document.addEventListener('DOMContentLoaded', function() {
    const cancelButton = document.querySelector("#cancel-button");
    cancelButton.disabled = true;
    cancelButton.addEventListener("click", function() {
        clearBoardHighlights();
        cancelButton.disabled = true;
    });
    
    const resetButton = document.querySelector("#reset-button");
    resetButton.addEventListener("click", function() {
        dchat.send(JSON.stringify({
            action: "anqi-reset",
        }));
        resetButton.disabled = true;
    });

    dchat.login(0, 0, parseInt(urlParams.get('position')));
    dchat.connect();

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
        dchat.room.messages.push(messageData);
        console.log(messageData);
    });
    
    dchat.handler.setMessageHandler('reload', (messageData) => {
        dchat.room.members = messageData.members;
        dchat.room.messages = messageData.messages;
        if (messageData.messages[0]) {
            const gs = JSON.parse(messageData.messages[0]);
            updateGame(gs);
            updateUserList();
        }
    });
    
    dchat.handler.setMessageHandler('anqi-update', (messageData) => {
        updateGame(messageData.gamestate);
    });
    
    dchat.handler.setMessageHandler('disconnect', (messageData) => {
        displayFullScreamDialog("服务器关闭连接", `原因: ${messageData.reason}`)
    });

    updateGame();
    updateUserList();
});

function sendMoveToServer(fromIndex, toIndex) {
    console.log(`Move from ${fromIndex} to ${toIndex}`);
    dchat.send(JSON.stringify({
        action: "anqi-move",
        move: [fromIndex, toIndex],
    }));
}

function updateGame(gs) {
    if (gs) {
        gamestate.board = gs.board;
        gamestate.turn_position = gs.turn_position;
        gamestate.gameover = gs.gameover;
    }
    if (gamestate.turn_position) {
        const resetButton = document.querySelector("#reset-button");
        resetButton.disabled = true;
    }
    let canmove = "both";
    if ((gamestate.turn_position === 1) && (dchat.member.position === 1)) {
        canmove = "red"
    } else if ((gamestate.turn_position === 2) && (dchat.member.position === 2)) {
        canmove = "black"
    } else {
        canmove = "none";
    }
    displayBoard(gamestate.board, canmove);

    const turnPlayerDiv = document.getElementById("turn-player");
    const turnPlayerSpan = turnPlayerDiv.getElementsByTagName("span")[0];
    turnPlayerSpan.innerHTML = gamestate.turn_position;

    const gameoverDiv = document.getElementById("gameover");
    if (gamestate.gameover === 1) {
        gameoverDiv.style.display = "block";
    } else {
        gameoverDiv.style.display = "none";
    }
}


function displayBoard(boardData, canmove) {
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
            if (canmove != "none") {
                chess.addEventListener("click", function() {
                    handlePieceClick(index);
                });
            }
        } else {
            chess.textContent = getPieceName(item[0]);
            if (item[0] < 7) {
                chess.classList.add("red-piece");
                if ((canmove == "red") || (canmove == "both")) {
                    chess.addEventListener("click", function() {
                        handlePieceClick(index);
                    });
                }
            } else {
                chess.classList.add("black-piece");
                if ((canmove == "black") || (canmove == "both")) {
                    chess.addEventListener("click", function() {
                        handlePieceClick(index);
                    });
                }
            }
        }

        chessContainer.appendChild(chess);
        board.appendChild(chessContainer);
    });
}

function handlePieceClick(index) {
    const pieceData = gamestate["board"][index];
    const pieceType = pieceData[0];
    const flipped = pieceData[1];
    const r = gamestate.cols;

    clearBoardHighlights();
    const cancelButton = document.querySelector("#cancel-button");
    cancelButton.disabled = false;

    if (flipped === 0) {
        // 未翻开的棋子，合法目标是它自身的位置
        setupHighlight(index, index);
    } else if (flipped === 1 && pieceType !== 5 && pieceType !== 12) { 
        // 翻开的棋子，不是炮
        const potentialMoves = [index - r, index + r, index - 1, index + 1];
        potentialMoves.forEach(toIndex => {
            if (checkValidMove(index, toIndex)) {
                setupHighlight(index, toIndex);
            }
        });
    } else if (flipped === 1 && (pieceType === 5 || pieceType === 12)) {
        // 翻开的棋子是炮，检查上下左右任意格
        checkValidPaoMove(index, -r); // Up
        checkValidPaoMove(index, r);  // Down
        checkValidPaoMove(index, -1); // Left
        checkValidPaoMove(index, 1);  // Right
    }
}


function checkValidPaoMove(fromIndex, step) {
    let toIndex = fromIndex + step;
    let i = 1;
    let mounts = 0;
    const r = gamestate.cols;
    while (toIndex >= 0 && toIndex < 32) {
        if ((Math.floor(fromIndex / r) !== (Math.floor(toIndex / r))) && (Math.abs(step) === 1)) {
            return;
        }
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
        i += 1;
        toIndex += step;
    }
}

function checkValidMove(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= 32) {
        return false;
    }
    const r = gamestate.cols;
    if ((Math.floor(fromIndex / r) !== (Math.floor(toIndex / r))) && ((fromIndex % r) !== (toIndex % r))) {
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
        })
    }
}

function clearBoardHighlights() {
    document.querySelectorAll("#board .highlight").forEach(highlight => {
        highlight.remove();
    });
    const cancelButton = document.querySelector("#cancel-button");
    cancelButton.disabled = true;
}

function getPieceName(type) {
    const pieceNames = ["将", "士", "象", "车", "马", "炮", "兵", "帅", "仕", "相", "车", "马", "炮", "卒"];
    return pieceNames[type];
}

function createMemberElement(member) {
    const ele = document.createElement('div');
    ele.className = 'user-item';
    ele.title = member.uuid;
    if (member.position !== 0) {
        const posEle = document.createElement("span");
        posEle.className = "position";
        posEle.textContent = member.position;
        ele.appendChild(posEle);
    }
    const nameEle = document.createElement("span");
    nameEle.textContent = member.nickname;
    ele.appendChild(nameEle);
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
