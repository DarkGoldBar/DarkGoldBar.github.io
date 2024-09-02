document.addEventListener("DOMContentLoaded", function() {
    const seatContainer = document.getElementById('seat-container');
    const nicknameContainer = document.getElementById('nickname-container');
    const nicknameInput = document.getElementById('nicknameInput');
    const playerCountSelect = document.getElementById('playerCount');
    const userUuid = generateUUID();
    let userNickname = 'Guest';
    let playerSeats = 2;

    nicknameInput.value = userNickname;

    function generateSeats(count) {
        seatContainer.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const seat = document.createElement('div');
            seat.classList.add('seat');
            seat.textContent = i;
            seat.dataset.position = i;
            seat.addEventListener('click', function() {
                if (!seat.classList.contains('occupied')) {
                    joinSeat(seat.dataset.position);
                }
            });
            seatContainer.appendChild(seat);
        }
    }

    function joinSeat(position) {
        if (position === '1') {
            playerCountSelect.style.display = 'block';
        } else {
            playerCountSelect.style.display = 'none';
        }

        nicknameContainer.style.display = 'none';

        const seat = document.querySelector(`.seat[data-position="${position}"]`);
        seat.classList.add('occupied');
        seat.textContent = userNickname;

        sendSeatData(position, userUuid, userNickname);
    }

    function sendSeatData(position, uuid, nickname) {
        const data = {
            position: position,
            uuid: uuid,
            nickname: nickname
        };

        console.log('Sending data to server:', data);
        // WebSocket or AJAX call to send data to the server
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    nicknameInput.addEventListener('input', function() {
        userNickname = nicknameInput.value;
    });

    playerCountSelect.addEventListener('change', function() {
        playerSeats = parseInt(playerCountSelect.value);
        generateSeats(playerSeats);
    });

    generateSeats(playerSeats);
});
