/**
 * Chat functionality for Virtual Events Platform
 * This script handles the WebSocket connection for real-time chat
 */

// Global variables
let chatSocket;
let chatMessages;
let chatInput;
let sendMessageBtn;
let chatRoom;
let chatUsername;

/**
 * Initialize the chat functionality
 * @param {string} room - The chat room name
 * @param {string} username - The current user's username
 */
function initChat(room, username) {
    chatRoom = room;
    chatUsername = username;
    
    // Get DOM elements
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendMessageBtn = document.getElementById('sendMessageBtn');
    
    // Initialize WebSocket connection
    setupChatSocket();
    
    // Set up event listeners
    setupChatEventListeners();
}

/**
 * Set up WebSocket connection for chat
 */
function setupChatSocket() {
    // Create WebSocket connection
    const wsUrl = `ws://${window.location.host}/ws/chat/${chatRoom}/`;
    console.log("Attempting to connect to WebSocket URL:", wsUrl);
    
    try {
        chatSocket = new WebSocket(wsUrl);
        console.log("WebSocket instance created");
    } catch (error) {
        console.error("Error creating WebSocket:", error);
        return;
    }
    
    // Connection opened
    chatSocket.onopen = function(event) {
        console.log('Chat WebSocket connection established successfully');
        // Load existing messages
        loadExistingMessages();
    };
    
    // Listen for messages
    chatSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        displayChatMessage(data.username, data.message);
    };
    
    // Handle errors
    chatSocket.onerror = function(error) {
        console.error('Chat WebSocket error:', error);
        displaySystemMessage('Connection error. Please try refreshing the page.');
    };
    
    // Handle connection closed
    chatSocket.onclose = function(event) {
        console.log('Chat WebSocket connection closed:', event.code, event.reason);
        
        // Display message to user
        displaySystemMessage('Chat connection lost. Trying to reconnect...');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
            setupChatSocket();
        }, 3000);
    };
}

/**
 * Set up event listeners for chat functionality
 */
function setupChatEventListeners() {
    // Send message button click
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    // Send message on Enter key
    if (chatInput) {
        chatInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
    }
}

/**
 * Load existing messages from the server
 */
function loadExistingMessages() {
    fetch(`/events/api/sessions/${chatRoom}/messages/`)
        .then(response => response.json())
        .then(data => {
            // Clear existing messages
            if (chatMessages) {
                chatMessages.innerHTML = '';
            }
            
            // Display each message
            data.messages.forEach(msg => {
                displayChatMessage(msg.user, msg.content);
            });
            
            // Scroll to bottom
            scrollToBottom();
        })
        .catch(error => {
            console.error('Error loading messages:', error);
            displaySystemMessage('Could not load previous messages.');
        });
}

/**
 * Send a chat message
 */
function sendMessage() {
    if (!chatInput || !chatSocket) return;
    
    const message = chatInput.value.trim();
    if (message) {
        // Send message to server
        chatSocket.send(JSON.stringify({
            'message': message
        }));
        
        // Clear input field
        chatInput.value = '';
        
        // Focus input field for next message
        chatInput.focus();
    }
}

/**
 * Display a chat message in the chat window
 * @param {string} username - The username of the sender
 * @param {string} message - The message content
 */
function displayChatMessage(username, message) {
    if (!chatMessages) return;
    
    const isCurrentUser = username === chatUsername;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.classList.add(isCurrentUser ? 'chat-message-self' : 'chat-message-other');
    
    // Format current time
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Set message content
    messageElement.innerHTML = `
        ${!isCurrentUser ? `<strong>${username}</strong><br>` : ''}
        ${message}
        <div class="text-end">
            <small class="text-muted">${timeString}</small>
        </div>
    `;
    
    // Add message to chat window
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
}

/**
 * Display a system message in the chat window
 * @param {string} message - The system message
 */
function displaySystemMessage(message) {
    if (!chatMessages) return;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('text-center', 'my-2');
    
    // Set message content
    messageElement.innerHTML = `
        <div class="alert alert-secondary py-1 px-2 d-inline-block">
            <small><i class="fas fa-info-circle"></i> ${message}</small>
        </div>
    `;
    
    // Add message to chat window
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
}

/**
 * Scroll the chat window to the bottom
 */
function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Clean up when leaving the chat
 */
function leaveChat() {
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.close();
    }
}

// Handle page unload to clean up
window.addEventListener('beforeunload', leaveChat);
