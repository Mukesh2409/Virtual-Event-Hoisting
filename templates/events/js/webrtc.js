/**
 * WebRTC implementation for Virtual Events Platform
 * This script handles the peer-to-peer connections for video streaming
 */

// Global variables
let localStream;
let peerConnections = {};
let roomName;
let currentUsername;
let localVideo;
let remoteVideo;
let signaling;

// ICE server configuration (STUN servers for NAT traversal)
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
    ]
};

/**
 * Initialize WebRTC functionality
 * @param {string} room - Room name for the WebRTC session
 * @param {string} username - Current user's username
 */
function initWebRTC(room, username) {
    roomName = room;
    currentUsername = username;
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');

    // Initialize WebSocket connection for signaling
    setupSignalingConnection();
    
    // Set up media stream
    setupLocalMedia();
    
    // Set up UI controls
    setupUIControls();
}

/**
 * Set up WebSocket connection for signaling
 */
function setupSignalingConnection() {
    // Create WebSocket connection
    const wsUrl = `wss://${window.location.host}/ws/webrtc/${roomName}/`;
    signaling = new WebSocket(wsUrl);
    
    // Connection opened
    signaling.onopen = function(event) {
        console.log('WebSocket signaling connection established');
    };
    
    // Listen for messages
    signaling.onmessage = function(event) {
        const message = JSON.parse(event.data);
        
        // Handle different message types
        switch(message.type) {
            case 'join':
                handleUserJoin(message.username);
                break;
            case 'leave':
                handleUserLeave(message.username);
                break;
            case 'offer':
                handleOffer(message);
                break;
            case 'answer':
                handleAnswer(message);
                break;
            case 'ice-candidate':
                handleIceCandidate(message);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    };
    
    // Handle errors
    signaling.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
    
    // Handle connection closed
    signaling.onclose = function(event) {
        console.log('WebSocket connection closed:', event.code, event.reason);
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
            setupSignalingConnection();
        }, 3000);
    };
}

/**
 * Set up local media stream (camera and microphone)
 */
function setupLocalMedia() {
    const constraints = {
        audio: true,
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        }
    };

    // Request access to the user's camera and microphone
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            // Save local stream
            localStream = stream;
            
            // Display local video
            localVideo.srcObject = stream;
            
            // After getting media, send join message to signaling server
            sendSignalingMessage({
                type: 'join',
                username: currentUsername,
                room: roomName
            });
        })
        .catch(error => {
            console.error('Error accessing media devices:', error);
            alert('Could not access camera or microphone. Please check your device settings and permissions.');
        });
}

/**
 * Set up UI controls for the WebRTC session
 */
function setupUIControls() {
    // Mute/unmute audio
    const muteAudioBtn = document.getElementById('muteAudioBtn');
    if (muteAudioBtn) {
        muteAudioBtn.addEventListener('click', () => {
            if (!localStream) {
                console.error('Local stream not available');
                alert('Audio stream not available. Please check your microphone settings.');
                return;
            }
            const audioTracks = localStream.getAudioTracks();
            if (!audioTracks.length) {
                console.error('No audio tracks found');
                alert('No audio device found. Please check your microphone connection.');
                return;
            }
            const isAudioEnabled = audioTracks[0].enabled;
            
            audioTracks.forEach(track => {
                track.enabled = !isAudioEnabled;
            });
            
            if (isAudioEnabled) {
                muteAudioBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Unmute';
                muteAudioBtn.classList.replace('btn-outline-primary', 'btn-outline-danger');
            } else {
                muteAudioBtn.innerHTML = '<i class="fas fa-microphone"></i> Mute';
                muteAudioBtn.classList.replace('btn-outline-danger', 'btn-outline-primary');
            }
        });
    }
    
    // Hide/show video
    const muteVideoBtn = document.getElementById('muteVideoBtn');
    if (muteVideoBtn) {
        muteVideoBtn.addEventListener('click', () => {
            if (!localStream) {
                console.error('Local stream not available');
                alert('Video stream not available. Please check your camera settings.');
                return;
            }
            const videoTracks = localStream.getVideoTracks();
            if (!videoTracks.length) {
                console.error('No video tracks found');
                alert('No camera device found. Please check your camera connection.');
                return;
            }
            const isVideoEnabled = videoTracks[0].enabled;
            
            videoTracks.forEach(track => {
                track.enabled = !isVideoEnabled;
            });
            
            if (isVideoEnabled) {
                muteVideoBtn.innerHTML = '<i class="fas fa-video-slash"></i> Show Video';
                muteVideoBtn.classList.replace('btn-outline-primary', 'btn-outline-danger');
            } else {
                muteVideoBtn.innerHTML = '<i class="fas fa-video"></i> Hide Video';
                muteVideoBtn.classList.replace('btn-outline-danger', 'btn-outline-primary');
            }
        });
    }
    
    // Screen sharing
    const shareScreenBtn = document.getElementById('shareScreenBtn');
    if (shareScreenBtn) {
        shareScreenBtn.addEventListener('click', async () => {
            try {
                if (!localStream) {
                    console.error('Local stream not available');
                    alert('Video stream not available. Please check your camera settings.');
                    return;
                }

                if (localStream.getVideoTracks()[0].label.includes('screen')) {
                    // Stop screen sharing and go back to camera
                    await setupLocalMedia();
                    shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i> Share Screen';
                    shareScreenBtn.classList.replace('btn-success', 'btn-outline-success');
                } else {
                    // Start screen sharing
                    const screenStream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            cursor: 'always',
                            displaySurface: 'monitor'
                        }
                    });

                    // Replace video track with screen track
                    const videoTrack = screenStream.getVideoTracks()[0];
                    const senders = Object.values(peerConnections)
                        .map(pc => pc.getSenders().find(s => s.track && s.track.kind === 'video'))
                        .filter(Boolean);
                            
                        // Replace the track in all peer connections
                        if (senders.length === 0) {
                            console.error('No video senders found in peer connections');
                            screenStream.getTracks().forEach(track => track.stop());
                            return;
                        }
                        
                        // Replace tracks in all peer connections
                        await Promise.all(senders.map(sender => sender.replaceTrack(videoTrack)));
                        
                        // Replace track in local stream
                        const oldVideoTrack = localStream.getVideoTracks()[0];
                        if (oldVideoTrack) {
                            oldVideoTrack.stop();
                            localStream.removeTrack(oldVideoTrack);
                        }
                        localStream.addTrack(videoTrack);
                        
                        // Update local video display
                        if (localVideo) {
                            localVideo.srcObject = localStream;
                        }
                        
                        // Update button state
                        shareScreenBtn.innerHTML = '<i class="fas fa-camera"></i> Share Camera';
                        shareScreenBtn.classList.replace('btn-outline-success', 'btn-success');
                        
                        // Handle screen sharing stop
                        videoTrack.onended = async () => {
                            await setupLocalMedia();
                            shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i> Share Screen';
                            shareScreenBtn.classList.replace('btn-success', 'btn-outline-success');
                        };
                    }
                    try {
                    } catch(error) {
                        console.error('Error sharing screen:', error);
                    try {
                        console.error('Error sharing screen:', error);
                    }
                }).catch(error => {
                    console.error('Error accessing screen sharing:', error);
                    alert('Failed to share screen. Please check your permissions and try again.');
                });
            }
        };
    

/**
 * Create a new RTCPeerConnection for a user
 * @param {string} username - Username of the peer
 * @returns {RTCPeerConnection} - The created peer connection
 */
function createPeerConnection(username) {
    // Create a new RTCPeerConnection
    const pc = new RTCPeerConnection(iceServers);
    
    // Add local stream tracks to the connection
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });
    
    // Handle ICE candidates
    pc.onicecandidate = event => {
        if (event.candidate) {
            sendSignalingMessage({
                type: 'ice-candidate',
                candidate: event.candidate,
                username: currentUsername,
                target: username
            });
        }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = event => {
        console.log(`Connection state change to ${pc.connectionState} for ${username}`);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            handleUserLeave(username);
        }
    };
    
    // Handle incoming streams
    pc.ontrack = event => {
        console.log('Received remote track from', username);
        remoteVideo.srcObject = event.streams[0];
    };
    
    return pc;
}

/**
 * Handle a user joining the room
 * @param {string} username - Username of the user who joined
 */
function handleUserJoin(username) {
    if (username === currentUsername) return;
    console.log(`${username} joined the room`);
    
    // Create a new peer connection for this user
    const pc = createPeerConnection(username);
    peerConnections[username] = pc;
    
    // Create and send an offer
    pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
            sendSignalingMessage({
                type: 'offer',
                offer: pc.localDescription,
                username: currentUsername,
                target: username
            });
        })
        .catch(error => {
            console.error('Error creating offer:', error);
        });
        
    // Update participants list
    addParticipantToUI(username);
}

/**
 * Handle a user leaving the room
 * @param {string} username - Username of the user who left
 */
function handleUserLeave(username) {
    if (!peerConnections[username]) return;
    console.log(`${username} left the room`);
    
    // Close the peer connection
    peerConnections[username].close();
    delete peerConnections[username];
    
    // Update participants list
    removeParticipantFromUI(username);
}

/**
 * Handle an incoming offer
 * @param {Object} message - The offer message
 */
function handleOffer(message) {
    const username = message.username;
    console.log(`Received offer from ${username}`);
    
    // Create a peer connection if one doesn't exist
    if (!peerConnections[username]) {
        peerConnections[username] = createPeerConnection(username);
        addParticipantToUI(username);
    }
    
    const pc = peerConnections[username];
    
    // Set the remote description
    pc.setRemoteDescription(new RTCSessionDescription(message.offer))
        .then(() => pc.createAnswer())
        .then(answer => pc.setLocalDescription(answer))
        .then(() => {
            sendSignalingMessage({
                type: 'answer',
                answer: pc.localDescription,
                username: currentUsername,
                target: username
            });
        })
        .catch(error => {
            console.error('Error handling offer:', error);
        });
}

/**
 * Handle an incoming answer
 * @param {Object} message - The answer message
 */
function handleAnswer(message) {
    const username = message.username;
    console.log(`Received answer from ${username}`);
    
    if (!peerConnections[username]) return;
    
    // Set the remote description
    peerConnections[username].setRemoteDescription(new RTCSessionDescription(message.answer))
        .catch(error => {
            console.error('Error handling answer:', error);
        });
}

/**
 * Handle an incoming ICE candidate
 * @param {Object} message - The ICE candidate message
 */
function handleIceCandidate(message) {
    const username = message.username;
    
    if (!peerConnections[username]) return;
    
    // Add the ICE candidate
    peerConnections[username].addIceCandidate(new RTCIceCandidate(message.candidate))
        .catch(error => {
            console.error('Error adding ICE candidate:', error);
        });
}

/**
 * Send a message through the signaling server
 * @param {Object} message - The message to send
 */
function sendSignalingMessage(message) {
    if (signaling.readyState === WebSocket.OPEN) {
        signaling.send(JSON.stringify(message));
    }
}

/**
 * Add a participant to the UI
 * @param {string} username - Username of the participant
 */
function addParticipantToUI(username) {
    const participantsList = document.getElementById('participantsList');
    if (!participantsList) return;
    
    // Check if this participant is already in the list
    if (document.getElementById(`participant-${username}`)) return;
    
    const participantItem = document.createElement('div');
    participantItem.id = `participant-${username}`;
    participantItem.className = 'participant-item';
    participantItem.innerHTML = `
        <i class="fas fa-user-circle me-2"></i>
        <span class="participant-name">${username}</span>
    `;
    
    participantsList.appendChild(participantItem);
}

/**
 * Remove a participant from the UI
 * @param {string} username - Username of the participant
 */
function removeParticipantFromUI(username) {
    const participantItem = document.getElementById(`participant-${username}`);
    if (participantItem) {
        participantItem.remove();
    }
}

/**
 * Clean up when leaving the session
 */
function leaveSession() {
    // Close all peer connections
    Object.values(peerConnections).forEach(pc => {
        pc.close();
    });
    peerConnections = {};
    
    // Stop all tracks in the local stream
    if (localStream) {
        localStream.getTracks().forEach(track => {
            track.stop();
        });
    }
    
    // Close the signaling connection
    if (signaling && signaling.readyState === WebSocket.OPEN) {
        sendSignalingMessage({
            type: 'leave',
            username: currentUsername,
            room: roomName
        });
        signaling.close();
    }
}

// Handle page unload to clean up
window.addEventListener('beforeunload', leaveSession);
