const currentUser = {uuid: '11111111-xxxx-xxxx-xxxx-12345678abcd', nickname: 'YourNickName', position: 1}
var users = [];

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
]

const cancelButton = document.querySelector('#cancel-button');
cancelButton.disabled = true;
cancelButton.addEventListener('click', function() {
    clearBoardHighlights();
    cancelButton.disabled = true; // 取消按钮被点击后设为不可用
});

generateBoard(gamestate.board);
document.getElementById('gameover').style.display = 'none';
users = exampleUsers;
updateUserList();


function generateBoard(boardData) {
    const board = document.getElementById('board');
    board.innerHTML = ''; // 清空现有内容

    boardData.forEach((item, index) => {
        const chessContainer = document.createElement('div');
        chessContainer.className = 'chess-container';
        chessContainer.setAttribute('data-id', index);
        
        const chess = document.createElement('div');
        chess.className = 'chess';

        // 根据数据来决定棋子的状态
        if (item[0] === -1 && item[1] === -1) {
            ; // 空位
        } else if (item[1] === 0) {
            chess.classList.add('back');
            chess.addEventListener('click', function() {
                handlePieceClick(index);
            });
        } else {
            chess.textContent = getPieceName(item[0]);
            chess.classList.add(item[0] < 7 ? 'red-piece' : 'black-piece');
            chess.addEventListener('click', function() {
                handlePieceClick(index);
            });
        }

        chessContainer.appendChild(chess);
        board.appendChild(chessContainer);
    });
}

function handlePieceClick(index) {
    const pieceData = gamestate['board'][index];
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
    const chess = document.querySelector(`#board [data-id='${toIndex}']`);
    if (chess) {
        const highlight = document.createElement('div');
        highlight.className = 'highlight';
        chess.appendChild(highlight);
        highlight.addEventListener('click', function moveHandler() {
            clearBoardHighlights();
            sendMoveToServer(fromIndex, toIndex); // 向服务器发送移动数据
            cancelButton.disabled = true;
        })
    }
}

function sendMoveToServer(fromIndex, toIndex) {
    console.log(`Move from ${fromIndex} to ${toIndex}`);
    // 实现向服务器发送数据的逻辑s
}

function clearBoardHighlights() {
    document.querySelectorAll('#board .highlight').forEach(highlight => {
        highlight.remove();
    });
    cancelButton.disabled = true;
}

function updateUserList() {
    function generateUserItem(user) {
        const userItem = document.createElement('div');
        if (user.position && user.position !== 0) {
            const positionSpan = document.createElement('span');
            positionSpan.className = 'position';
            positionSpan.textContent = user.position;
            userItem.appendChild(positionSpan);
        }
        userItem.appendChild(document.createTextNode(user.nickname));
        userItem.className = 'user-item';
        userItem.title = user.uuid;
        return userItem
    }

    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

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


function getPieceName(type) {
    const pieceNames = ['将', '士', '象', '车', '马', '炮', '兵', '帅', '仕', '相', '车', '马', '炮', '卒'];
    return pieceNames[type];
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // 交换元素
    }
    return array;
}
