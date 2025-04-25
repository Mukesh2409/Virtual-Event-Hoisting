let chatSocket;
let chatMessages;
let chatInput;
let sendMessageBtn;
let participantsList;
let messageQueue = [];
let isConnected = false;

function initChat(room, user,sessionId) {
    
    username = user;

    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendMessageBtn = document.getElementById('sendMessageBtn');
    participantsList = document.getElementById('participantsList');
    
   
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat/${room}/`;
    chatSocket = new WebSocket(wsUrl);
    
    fetch(`${window.location.origin}/events/api/sessions/${sessionId}/messages/`) // Ensure `room` is the session ID
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.messages) {
                data.messages.forEach(msg => {
                    addChatMessage(msg.user, msg.content, msg.user === username);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
            addSystemMessage('Failed to load chat history. Please refresh the page.');
        });
    
    chatSocket.onopen = () => {
        console.log('WebSocket connection established');
        isConnected = true;
        while (messageQueue.length > 0) {
            const msg = messageQueue.shift();
            chatSocket.send(msg);
        }
    };
    chatSocket.onmessage = handleMessage;
    chatSocket.onclose = handleClose;
    chatSocket.onerror = handleError;
    
    setupChatControls();
    
    sendSystemMessage('joined');
}

function handleMessage(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'chat_message':
            addChatMessage(data.username, data.message, data.username === username);
            break;
        case 'user_join':
            addParticipant(data.username);
            addSystemMessage(`${data.username} joined the session`);
            break;
        case 'user_leave':
            removeParticipant(data.username);
            addSystemMessage(`${data.username} left the session`);
            break;
    }
}

function handleClose(event) {
    console.log('Chat connection closed');
    isConnected = false;
    addSystemMessage('Connection lost. Please refresh the page.');
}

function handleError(error) {
    console.error('WebSocket error:', error);
    addSystemMessage('Error connecting to chat. Please refresh the page.');
}

function setupChatControls() {
    sendMessageBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        chatSocket.send(JSON.stringify({
            'type': 'chat_message',
            'message': message,
            'username': username
        }));
        chatInput.value = '';
    }
}

function sendSystemMessage(type) {
    const message = JSON.stringify({
        'type': type,
        'message': type  
    });
    
    if (isConnected && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(message);
        addSystemMessage(type);
    } else {
        messageQueue.push(message);
        addSystemMessage(type);
    }
}

function addChatMessage(username, message, isSelf) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isSelf ? 'chat-message-self' : 'chat-message-other'}`;
    messageDiv.innerHTML = `
        <small class="text-muted">${username}</small><br>
        ${message}
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'text-center text-muted my-2';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addParticipant(username) {
    if (!participantsList) return;
    
    const existingParticipant = Array.from(participantsList.children)
        .find(p => p.textContent === username);
    if (existingParticipant) return;
    
    const participantElement = document.createElement('div');
    participantElement.classList.add('participant');
    participantElement.setAttribute('data-username', username);
    participantElement.textContent = username;
    participantsList.appendChild(participantElement);
}

function removeParticipant(username) {
    if (!participantsList) return;
    
    const participant = participantsList.querySelector(`[data-username="${username}"]`);
    if (participant) {
        participantsList.removeChild(participant);
    }
}

function cleanup() {
    if (chatSocket) {
        sendSystemMessage('left');
        chatSocket.close();
    }
}

window.initChat = initChat;
window.cleanup = cleanup;