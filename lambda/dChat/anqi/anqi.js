function generateBoard(){
    const board = document.getElementById('board');
    for (let i = 0; i < 32; i++) {
        const square = document.createElement('div');
        square.className = 'square back';
        square.setAttribute('data-id', i);
        board.appendChild(square);
    }    
}

generateBoard()
