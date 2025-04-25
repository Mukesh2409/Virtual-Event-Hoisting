// // WebRTC Implementation
// let localStream;
// let screenStream;
// let peerConnection;
// let roomName;
// let username;
// let isScreenSharing = false;
// let isOrganizer = false;

// // STUN servers configuration
// const configuration = {
//     iceServers: [
//         { urls: 'stun:stun.l.google.com:19302' },
//         { urls: 'stun:stun1.l.google.com:19302' }
//     ]
// };

// // Initialize organizer stream
// window.initOrganizerStream = async function(room) {
//     try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//             audio: true,
//             video: {
//                 width: { ideal: 1280 },
//                 height: { ideal: 720 },
//                 frameRate: { ideal: 30 }
//             }
//         });
//         return stream;
//     } catch (error) {
//         console.error('Error initializing organizer stream:', error);
//         throw error;
//     }
// };

// // Initialize attendee stream
// window.initAttendeeStream = async function(room, user) {
//     try {
//         const attendeeConnection = new RTCPeerConnection(configuration);
        
//         // Handle incoming tracks for attendee
//         attendeeConnection.ontrack = handleTrackEvent;
        
//         // Handle connection state changes
//         attendeeConnection.oniceconnectionstatechange = () => {
//             console.log('Attendee ICE Connection State:', attendeeConnection.iceConnectionState);
//             if (attendeeConnection.iceConnectionState === 'disconnected' || 
//                 attendeeConnection.iceConnectionState === 'failed') {
//                 handleDisconnection();
//             }
//         };
        
//         attendeeConnection.onicecandidate = (event) => {
//             if (event.candidate) {
//                 sendSignalingMessage({
//                     type: 'ice_candidate',
//                     candidate: event.candidate
//                 });
//             }
//         };
        
//         return attendeeConnection;
//     } catch (error) {
//         console.error('Error initializing attendee connection:', error);
//         throw error;
//     }
// };

// // Initialize WebRTC
// async function initWebRTC(room, user, organizer = false) {
//     console.log(`Initializing WebRTC: room=${room}, user=${user}, isOrganizer=${organizer}`);
//     roomName = room;
//     username = user;
//     isOrganizer = organizer;
    
//     try {
//         if (isOrganizer) {
//             // Initialize organizer's high-quality stream
//             localStream = await window.initOrganizerStream(room);
            
//             // Display local video
//             const localVideo = document.getElementById('localVideo');
//             localVideo.srcObject = localStream;
            
//             // Initialize peer connection
//             peerConnection = new RTCPeerConnection(configuration);
            
//             // Add local tracks to peer connection
//             localStream.getTracks().forEach(track => {
//                 const sender = peerConnection.addTrack(track, localStream);
//                 if (track.kind === 'audio') {
//                     // Ensure audio track is properly configured
//                     track.enabled = true;
//                     try {
//                         sender.setParameters({
//                             ...sender.getParameters(),
//                             encodings: [{
//                                 priority: 'high',
//                                 maxBitrate: 128000 // 128 kbps for good audio quality
//                             }]
//                         });
//                     } catch (e) {
//                         console.warn("Could not set audio parameters:", e);
//                     }
//                 }
//             });
//         } else {
//             // Initialize attendee's connection
//             peerConnection = await window.initAttendeeStream(room, user);
//         }
        
//         // Handle incoming tracks
//         peerConnection.ontrack = handleTrackEvent;
        
//         // Handle connection state changes
//         peerConnection.oniceconnectionstatechange = handleICEConnectionStateChange;
//         peerConnection.onicecandidate = handleICECandidate;
        
//         // Set up UI controls
//         setupControls();
        
//         // Initialize signaling
//         initSignaling();
        
//         // If organizer, create and send offer after a short delay
//         if (isOrganizer) {
//             setTimeout(() => {
//                 createAndSendOffer();
//             }, 1000);
//         }
        
//     } catch (error) {
//         console.error('Error initializing WebRTC:', error);
//         alert('Error accessing camera/microphone. Please ensure permissions are granted.');
//     }
// }

// // Initialize WebRTC signaling
// function initSignaling() {
//     // Create WebSocket connection
//     const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
//     const wsUrl = `${wsProtocol}//${window.location.host}/ws/webrtc/${roomName}/`;
    
//     window.signalSocket = new WebSocket(wsUrl);
    
//     window.signalSocket.onopen = () => {
//         console.log('WebRTC signaling connection established');
//     };
    
//     window.signalSocket.onmessage = async (event) => {
//         const data = JSON.parse(event.data);
//         console.log('Received signaling message:', data.type);
        
//         if (data.type === 'offer' && !isOrganizer) {
//             await handleOffer(data);
//         } else if (data.type === 'answer' && isOrganizer) {
//             await handleAnswer(data);
//         } else if (data.type === 'ice_candidate') {
//             handleRemoteICECandidate(data);
//         }
//     };
    
//     window.signalSocket.onerror = (error) => {
//         console.error('WebRTC signaling error:', error);
//     };
    
//     window.signalSocket.onclose = () => {
//         console.log('WebRTC signaling connection closed');
//     };
// }

// // Send a signaling message
// function sendSignalingMessage(message) {
//     if (window.signalSocket && window.signalSocket.readyState === WebSocket.OPEN) {
//         window.signalSocket.send(JSON.stringify(message));
//     } else {
//         console.warn('Signaling socket not open, message not sent');
//     }
// }

// // Handle incoming media tracks
// function handleTrackEvent(event) {
//     if (!event.streams || !event.streams[0]) return;
//     const remoteVideo = document.getElementById('remoteVideo');
//     if (remoteVideo) {
//         remoteVideo.srcObject = event.streams[0];
//         // Ensure video plays automatically
//         remoteVideo.play().catch(error => {
//             console.warn('Auto-play failed:', error);
//         });
//     }
// }

// // Handle ICE connection state changes
// function handleICEConnectionStateChange() {
//     console.log('ICE Connection State:', peerConnection.iceConnectionState);
//     if (peerConnection.iceConnectionState === 'disconnected' || 
//         peerConnection.iceConnectionState === 'failed') {
//         handleDisconnection();
//     }
// }

// // Handle ICE candidates
// function handleICECandidate(event) {
//     if (event.candidate) {
//         // Send the ICE candidate to the remote peer via your signaling server
//         sendSignalingMessage({
//             type: 'ice_candidate',
//             candidate: event.candidate
//         });
//     }
// }

// // Handle incoming offer from remote peer
// async function handleOffer(data) {
//     try {
//         await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
//         const answer = await peerConnection.createAnswer();
//         await peerConnection.setLocalDescription(answer);
        
//         sendSignalingMessage({
//             type: 'answer',
//             answer: peerConnection.localDescription
//         });
//     } catch (error) {
//         console.error('Error handling offer:', error);
//     }
// }

// // Handle incoming answer from remote peer
// async function handleAnswer(data) {
//     try {
//         const remoteDesc = new RTCSessionDescription(data.answer);
//         await peerConnection.setRemoteDescription(remoteDesc);
//     } catch (error) {
//         console.error('Error handling answer:', error);
//     }
// }

// // Handle incoming ICE candidate from remote peer
// function handleRemoteICECandidate(data) {
//     try {
//         const candidate = new RTCIceCandidate(data.candidate);
//         peerConnection.addIceCandidate(candidate);
//     } catch (error) {
//         console.error('Error adding received ICE candidate:', error);
//     }
// }

// // Create and send an offer
// async function createAndSendOffer() {
//     try {
//         const offer = await peerConnection.createOffer();
//         await peerConnection.setLocalDescription(offer);
        
//         sendSignalingMessage({
//             type: 'offer',
//             offer: peerConnection.localDescription
//         });
//     } catch (error) {
//         console.error('Error creating offer:', error);
//     }
// }

// // Handle disconnection
// function handleDisconnection() {
//     stopScreenSharing();
//     if (peerConnection) {
//         peerConnection.close();
//         // Try to reinitialize after a short delay
//         setTimeout(() => {
//             initWebRTC(roomName, username, isOrganizer);
//         }, 2000);
//     }
// }

// // Set up UI controls
// function setupControls() {
//     const muteAudioBtn = document.getElementById('muteAudioBtn');
//     const muteVideoBtn = document.getElementById('muteVideoBtn');
//     const shareScreenBtn = document.getElementById('shareScreenBtn');
//     const leaveBtn = document.getElementById('leaveBtn');
    
//     if (!muteAudioBtn || !muteVideoBtn || !shareScreenBtn || !leaveBtn) {
//         console.error('Required control buttons not found');
//         return;
//     }

//     // Audio mute/unmute
//     muteAudioBtn.addEventListener('click', () => {
//         console.log("Audio button clicked");
//         if (!localStream) {
//             console.error('Local stream not available');
//             return;
//         }
        
//         const audioTrack = localStream.getAudioTracks()[0];
//         if (audioTrack) {
//             // Toggle the track's enabled state
//             audioTrack.enabled = !audioTrack.enabled;
            
//             // If disabling, stop the track to release the microphone
//             if (!audioTrack.enabled) {
//                 audioTrack.stop();
                
//                 // Update button appearance
//                 muteAudioBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
//                 muteAudioBtn.classList.remove('btn-light');
//                 muteAudioBtn.classList.add('btn-danger');
//             } else {
//                 // If enabling, we need to get a new audio track
//                 navigator.mediaDevices.getUserMedia({ audio: true })
//                     .then(stream => {
//                         const newAudioTrack = stream.getAudioTracks()[0];
                        
//                         // Add the new track to local stream
//                         if (localStream.getAudioTracks().length > 0) {
//                             localStream.removeTrack(localStream.getAudioTracks()[0]);
//                         }
//                         localStream.addTrack(newAudioTrack);
                        
//                         // Replace the track in the peer connection
//                         const audioSender = peerConnection.getSenders()
//                             .find(s => s.track && s.track.kind === 'audio');
//                         if (audioSender) {
//                             audioSender.replaceTrack(newAudioTrack);
//                         }
                        
//                         // Update button appearance
//                         muteAudioBtn.innerHTML = '<i class="fas fa-microphone"></i>';
//                         muteAudioBtn.classList.remove('btn-danger');
//                         muteAudioBtn.classList.add('btn-light');
//                     })
//                     .catch(err => {
//                         console.error("Error reacquiring microphone:", err);
//                         // Revert UI if we can't get the microphone
//                         audioTrack.enabled = false;
//                         muteAudioBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
//                         muteAudioBtn.classList.remove('btn-light');
//                         muteAudioBtn.classList.add('btn-danger');
//                     });
//             }
//         }
//     });
    
//     // Video mute/unmute
//     muteVideoBtn.addEventListener('click', () => {
//         console.log("Video button clicked");
//         if (!localStream) {
//             console.error('Local stream not available');
//             return;
//         }
        
//         const videoTrack = localStream.getVideoTracks()[0];
//         if (videoTrack) {
//             // Toggle the track's enabled state
//             videoTrack.enabled = !videoTrack.enabled;
            
//             // If disabling, stop the track to turn off the camera
//             if (!videoTrack.enabled) {
//                 videoTrack.stop();
                
//                 // Update button appearance
//                 muteVideoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
//                 muteVideoBtn.classList.remove('btn-light');
//                 muteVideoBtn.classList.add('btn-danger');
//             } else {
//                 // If enabling, we need to get a new video track
//                 navigator.mediaDevices.getUserMedia({ 
//                     video: {
//                         width: { ideal: 1280 },
//                         height: { ideal: 720 },
//                         frameRate: { ideal: 30 }
//                     }
//                 })
//                 .then(stream => {
//                     const newVideoTrack = stream.getVideoTracks()[0];
                    
//                     // Add the new track to local stream
//                     if (localStream.getVideoTracks().length > 0) {
//                         localStream.removeTrack(localStream.getVideoTracks()[0]);
//                     }
//                     localStream.addTrack(newVideoTrack);
                    
//                     // Update local video
//                     const localVideo = document.getElementById('localVideo');
//                     if (localVideo) {
//                         localVideo.srcObject = localStream;
//                     }
                    
//                     // Replace the track in the peer connection
//                     const videoSender = peerConnection.getSenders()
//                         .find(s => s.track && s.track.kind === 'video');
//                     if (videoSender) {
//                         videoSender.replaceTrack(newVideoTrack);
//                     }
                    
//                     // Update button appearance
//                     muteVideoBtn.innerHTML = '<i class="fas fa-video"></i>';
//                     muteVideoBtn.classList.remove('btn-danger');
//                     muteVideoBtn.classList.add('btn-light');
//                 })
//                 .catch(err => {
//                     console.error("Error reacquiring camera:", err);
//                     // Revert UI if we can't get the camera
//                     videoTrack.enabled = false;
//                     muteVideoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
//                     muteVideoBtn.classList.remove('btn-light');
//                     muteVideoBtn.classList.add('btn-danger');
//                 });
//             }
//         }
//     });
    
//     // Screen sharing
//     shareScreenBtn.addEventListener('click', async () => {
//         console.log("Screen share button clicked");
//         try {
//             await toggleScreenSharing();
//         } catch (error) {
//             console.error('Screen sharing error:', error);
//         }
//     });
    
//     // Leave session
//     leaveBtn.addEventListener('click', () => {
//         console.log("Leave button clicked");
//         // Clean up
//         if (localStream) {
//             localStream.getTracks().forEach(track => track.stop());
//         }
//         if (screenStream) {
//             screenStream.getTracks().forEach(track => track.stop());
//         }
//         if (peerConnection) {
//             peerConnection.close();
//         }
//         if (window.signalSocket) {
//             window.signalSocket.close();
//         }
        
//         // Redirect back to session detail
//         window.location.href = document.referrer || '/';
//     });
// }

// // Toggle screen sharing
// async function toggleScreenSharing() {
//     if (!peerConnection) {
//         console.error('Peer connection not initialized');
//         return false;
//     }
    
//     try {
//         if (!isScreenSharing) {
//             // Start screen sharing
//             screenStream = await navigator.mediaDevices.getDisplayMedia({
//                 video: {
//                     cursor: 'always',
//                     displaySurface: 'monitor'
//                 }
//             });
            
//             const screenTrack = screenStream.getVideoTracks()[0];
            
//             // Get the video sender
//             const videoSender = peerConnection.getSenders()
//                 .find(sender => sender.track && sender.track.kind === 'video');
            
//             if (videoSender) {
//                 // Replace the camera track with the screen track
//                 await videoSender.replaceTrack(screenTrack);
                
//                 // When user stops sharing via browser UI
//                 screenTrack.onended = () => {
//                     stopScreenSharing();
//                 };
                
//                 isScreenSharing = true;
                
//                 // Update UI
//                 const shareScreenBtn = document.getElementById('shareScreenBtn');
//                 if (shareScreenBtn) {
//                     shareScreenBtn.innerHTML = '<i class="fas fa-times"></i>';
//                     shareScreenBtn.classList.remove('btn-success');
//                     shareScreenBtn.classList.add('btn-warning');
//                 }
                
//                 console.log('Screen sharing started');
//             } else {
//                 console.error('No video sender found');
//                 return false;
//             }
//         } else {
//             await stopScreenSharing();
//         }
        
//         return isScreenSharing;
//     } catch (error) {
//         console.error('Error in screen sharing:', error);
//         return false;
//     }
// }

// // Stop screen sharing
// async function stopScreenSharing() {
//     if (!isScreenSharing || !screenStream) {
//         return;
//     }
    
//     try {
//         // Stop all screen share tracks
//         screenStream.getTracks().forEach(track => track.stop());
        
//         // Get back the camera video track
//         if (localStream) {
//             const videoTrack = localStream.getVideoTracks()[0];
//             if (videoTrack) {
//                 // Get the video sender
//                 const videoSender = peerConnection.getSenders()
//                     .find(sender => sender.track && sender.track.kind === 'video');
                
//                 if (videoSender) {
//                     // Replace screen track with camera track
//                     await videoSender.replaceTrack(videoTrack);
//                 }
//             }
//         }
        
//         screenStream = null;
//         isScreenSharing = false;
        
//         // Update UI
//         const shareScreenBtn = document.getElementById('shareScreenBtn');
//         if (shareScreenBtn) {
//             shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
//             shareScreenBtn.classList.remove('btn-warning');
//             shareScreenBtn.classList.add('btn-success');
//         }
        
//         console.log('Screen sharing stopped');
//     } catch (error) {
//         console.error('Error stopping screen share:', error);
//     }
// }




// WebRTC Implementation
let localStream;
let screenStream;
let peerConnection;
let roomName;
let username;
let isScreenSharing = false;
let isOrganizer = false;
let hasReceivedOffer = false;
let hasReceivedAnswer = false;

// STUN servers configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Initialize WebRTC
async function initWebRTC(room, user, organizer = false) {
    console.log(`Initializing WebRTC: room=${room}, user=${user}, isOrganizer=${organizer}`);
    roomName = room;
    username = user;
    isOrganizer = organizer;
    
    try {
        // Initialize local stream with audio/video for all users
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            }
        });
        
        // Display local video
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
        // Initialize peer connection
        peerConnection = new RTCPeerConnection(configuration);
        
        // Add local tracks to peer connection for ALL users
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Handle incoming tracks
        peerConnection.ontrack = handleTrackEvent;
        
        // Handle connection state changes
        peerConnection.oniceconnectionstatechange = handleICEConnectionStateChange;
        peerConnection.onicecandidate = handleICECandidate;
        
        // Set up UI controls
        setupControls();
        
        // Initialize signaling
        initSignaling();
        
    } catch (error) {
        console.error('Error initializing WebRTC:', error);
        alert('Error accessing camera/microphone. Please ensure permissions are granted.');
    }
}

// Initialize WebRTC signaling
function initSignaling() {
    // Create WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/webrtc/${roomName}/`;
    
    window.signalSocket = new WebSocket(wsUrl);
    
    window.signalSocket.onopen = () => {
        console.log('WebRTC signaling connection established');
        // Announce presence
        sendSignalingMessage({
            type: 'join',
            username: username,
            isOrganizer: isOrganizer
        });
        
        // Wait a moment then create an offer if organizer
        if (isOrganizer) {
            setTimeout(() => {
                createAndSendOffer();
            }, 1000);
        }
    };
    
    window.signalSocket.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Received signaling message:', data.type);
            
            // Process different signaling messages
            if (data.type === 'offer' && !isOrganizer && !hasReceivedOffer) {
                if (peerConnection.signalingState !== 'stable') {
                    console.log('Cannot handle offer in state:', peerConnection.signalingState);
                    return;
                }
                hasReceivedOffer = true;
                await handleOffer(data);
            } else if (data.type === 'answer' && isOrganizer && !hasReceivedAnswer) {
                if (peerConnection.signalingState !== 'have-local-offer') {
                    console.log('Cannot handle answer in state:', peerConnection.signalingState);
                    return;
                }
                hasReceivedAnswer = true;
                await handleAnswer(data);
            } else if (data.type === 'ice_candidate') {
                handleRemoteICECandidate(data);
            } else if (data.type === 'join') {
                // If I'm organizer and someone else joins, send them an offer
                if (isOrganizer && data.username !== username) {
                    console.log("New attendee joined, sending offer");
                    // Small delay to ensure their connection is ready
                    setTimeout(() => {
                        createAndSendOffer();
                    }, 500);
                }
            }
        } catch (error) {
            console.error("Error processing message:", error, event.data);
        }
    };
    
    window.signalSocket.onerror = (error) => {
        console.error('WebRTC signaling error:', error);
    };
    
    window.signalSocket.onclose = () => {
        console.log('WebRTC signaling connection closed');
    };
}

// Send a signaling message
function sendSignalingMessage(message) {
    if (window.signalSocket && window.signalSocket.readyState === WebSocket.OPEN) {
        window.signalSocket.send(JSON.stringify(message));
    } else {
        console.warn('Signaling socket not open, message not sent');
    }
}

// Handle incoming media tracks
function handleTrackEvent(event) {
    if (!event.streams || !event.streams[0]) return;
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
        // Add muted attribute to help with autoplay
        remoteVideo.muted = true;
        
        // Try to play with user interaction handling
        const playVideo = async () => {
            try {
                await remoteVideo.play();
                // If successful, unmute if this is not the first try
                if (remoteVideo.hasAttribute('data-autoplay-failed')) {
                    remoteVideo.muted = false;
                }
            } catch (error) {
                console.warn('Auto-play failed:', error);
                // Mark that autoplay failed
                remoteVideo.setAttribute('data-autoplay-failed', 'true');
                
                // Show play button overlay
                const playButton = document.createElement('button');
                playButton.innerHTML = '<i class="fas fa-play"></i>';
                playButton.className = 'video-play-button';
                playButton.onclick = async () => {
                    try {
                        await remoteVideo.play();
                        remoteVideo.muted = false;
                        playButton.remove();
                    } catch (err) {
                        console.error('Play failed after user interaction:', err);
                    }
                };
                remoteVideo.parentElement.appendChild(playButton);
            }
        };
        
        playVideo();
    }
}

// Handle ICE connection state changes
function handleICEConnectionStateChange() {
    console.log('ICE Connection State:', peerConnection.iceConnectionState);
    if (peerConnection.iceConnectionState === 'disconnected' || 
        peerConnection.iceConnectionState === 'failed') {
        handleDisconnection();
    } else if (peerConnection.iceConnectionState === 'connected') {
        console.log('WebRTC connection established successfully!');
    }
}

// Handle ICE candidates
function handleICECandidate(event) {
    if (event.candidate) {
        // Send the ICE candidate to the remote peer via your signaling server
        sendSignalingMessage({
            type: 'ice_candidate',
            candidate: event.candidate
        });
    }
}

// Handle incoming offer from remote peer
async function handleOffer(data) {
    try {
        console.log("Handling offer from organizer");
        
        // Check if peer connection is in the right state to accept an offer
        if (peerConnection.signalingState !== 'stable') {
            console.warn('Cannot handle offer in state: ' + peerConnection.signalingState);
            return;
        }
        
        // Set remote description from offer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // Send answer back
        sendSignalingMessage({
            type: 'answer',
            answer: peerConnection.localDescription
        });
        
        console.log("Sent answer to offer");
    } catch (error) {
        console.error('Error handling offer:', error);
    }
}

// Handle incoming answer from remote peer
async function handleAnswer(data) {
    try {
        console.log("Handling answer from attendee");
        
        // Check if peer connection is in the right state to accept an answer
        if (peerConnection.signalingState !== 'have-local-offer') {
            console.warn('Cannot handle answer in state: ' + peerConnection.signalingState);
            return;
        }
        
        // Set remote description from answer
        const remoteDesc = new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(remoteDesc);
        console.log("Set remote description from answer");
        
        // Add any buffered ICE candidates
        if (iceCandidateBuffer.length > 0) {
            console.log(`Adding ${iceCandidateBuffer.length} buffered ICE candidates`);
            for (const candidate of iceCandidateBuffer) {
                await peerConnection.addIceCandidate(candidate);
            }
            iceCandidateBuffer = [];
        }
    } catch (error) {
        console.error('Error handling answer:', error);
    }
}

// Buffer for ICE candidates received before remote description
let iceCandidateBuffer = [];

// Handle incoming ICE candidate from remote peer
async function handleRemoteICECandidate(data) {
    try {
        const candidate = new RTCIceCandidate(data.candidate);
        
        if (peerConnection.remoteDescription === null) {
            // Buffer the candidate if remote description is not set yet
            console.log('Buffering ICE candidate until remote description is set');
            iceCandidateBuffer.push(candidate);
            return;
        }
        
        await peerConnection.addIceCandidate(candidate);
    } catch (error) {
        console.error('Error handling ICE candidate:', error);
    }
}

// Create and send an offer
async function createAndSendOffer() {
    try {
        if (!isOrganizer) {
            console.warn('Only organizer should create offers');
            return;
        }
        
        // Reset state
        hasReceivedAnswer = false;
        
        // Check if peer connection is in the right state to create an offer
        if (peerConnection.signalingState !== 'stable') {
            console.warn('Cannot create offer in state: ' + peerConnection.signalingState);
            return;
        }
        
        const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true, 
            offerToReceiveVideo: true
        });
        await peerConnection.setLocalDescription(offer);
        
        sendSignalingMessage({
            type: 'offer',
            offer: peerConnection.localDescription
        });
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Handle disconnection
function handleDisconnection() {
    stopScreenSharing();
    if (peerConnection) {
        peerConnection.close();
        // Reset flags
        hasReceivedOffer = false;
        hasReceivedAnswer = false;
        
        // Try to reinitialize after a short delay
        setTimeout(() => {
            initWebRTC(roomName, username, isOrganizer);
        }, 2000);
    }
}

// Set up UI controls
function setupControls() {
    const muteAudioBtn = document.getElementById('muteAudioBtn');
    const muteVideoBtn = document.getElementById('muteVideoBtn');
    const shareScreenBtn = document.getElementById('shareScreenBtn');
    const leaveBtn = document.getElementById('leaveBtn');
    
    if (!muteAudioBtn || !muteVideoBtn || !shareScreenBtn || !leaveBtn) {
        console.error('Required control buttons not found');
        return;
    }

    // Audio mute/unmute
    muteAudioBtn.addEventListener('click', () => {
        console.log("Audio button clicked");
        if (!localStream) {
            console.error('Local stream not available');
            return;
        }
        
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            // Toggle the track's enabled state
            audioTrack.enabled = !audioTrack.enabled;
            
            // If disabling, stop the track to release the microphone
            if (!audioTrack.enabled) {
                audioTrack.stop();
                
                // Update button appearance
                muteAudioBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                muteAudioBtn.classList.remove('btn-light');
                muteAudioBtn.classList.add('btn-danger');
            } else {
                // If enabling, we need to get a new audio track
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        const newAudioTrack = stream.getAudioTracks()[0];
                        
                        // Add the new track to local stream
                        if (localStream.getAudioTracks().length > 0) {
                            localStream.removeTrack(localStream.getAudioTracks()[0]);
                        }
                        localStream.addTrack(newAudioTrack);
                        
                        // Replace the track in the peer connection
                        const audioSender = peerConnection.getSenders()
                            .find(s => s.track && s.track.kind === 'audio');
                        if (audioSender) {
                            audioSender.replaceTrack(newAudioTrack);
                        }
                        
                        // Update button appearance
                        muteAudioBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                        muteAudioBtn.classList.remove('btn-danger');
                        muteAudioBtn.classList.add('btn-light');
                    })
                    .catch(err => {
                        console.error("Error reacquiring microphone:", err);
                        // Revert UI if we can't get the microphone
                        audioTrack.enabled = false;
                        muteAudioBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                        muteAudioBtn.classList.remove('btn-light');
                        muteAudioBtn.classList.add('btn-danger');
                    });
            }
        }
    });
    
    // Video mute/unmute
    muteVideoBtn.addEventListener('click', () => {
        console.log("Video button clicked");
        if (!localStream) {
            console.error('Local stream not available');
            return;
        }
        
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            // Toggle the track's enabled state
            videoTrack.enabled = !videoTrack.enabled;
            
            // If disabling, stop the track to turn off the camera
            if (!videoTrack.enabled) {
                videoTrack.stop();
                
                // Update button appearance
                muteVideoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
                muteVideoBtn.classList.remove('btn-light');
                muteVideoBtn.classList.add('btn-danger');
            } else {
                // If enabling, we need to get a new video track
                navigator.mediaDevices.getUserMedia({ 
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 }
                    }
                })
                .then(stream => {
                    const newVideoTrack = stream.getVideoTracks()[0];
                    
                    // Add the new track to local stream
                    if (localStream.getVideoTracks().length > 0) {
                        localStream.removeTrack(localStream.getVideoTracks()[0]);
                    }
                    localStream.addTrack(newVideoTrack);
                    
                    // Update local video
                    const localVideo = document.getElementById('localVideo');
                    if (localVideo) {
                        localVideo.srcObject = localStream;
                    }
                    
                    // Replace the track in the peer connection
                    const videoSender = peerConnection.getSenders()
                        .find(s => s.track && s.track.kind === 'video');
                    if (videoSender) {
                        videoSender.replaceTrack(newVideoTrack);
                    }
                    
                    // Update button appearance
                    muteVideoBtn.innerHTML = '<i class="fas fa-video"></i>';
                    muteVideoBtn.classList.remove('btn-danger');
                    muteVideoBtn.classList.add('btn-light');
                })
                .catch(err => {
                    console.error("Error reacquiring camera:", err);
                    // Revert UI if we can't get the camera
                    videoTrack.enabled = false;
                    muteVideoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
                    muteVideoBtn.classList.remove('btn-light');
                    muteVideoBtn.classList.add('btn-danger');
                });
            }
        }
    });
    
    // Screen sharing
    shareScreenBtn.addEventListener('click', async () => {
        console.log("Screen share button clicked");
        try {
            await toggleScreenSharing();
        } catch (error) {
            console.error('Screen sharing error:', error);
        }
    });
    
    // Leave session
    leaveBtn.addEventListener('click', () => {
        console.log("Leave button clicked");
        // Clean up
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }
        if (window.signalSocket) {
            window.signalSocket.close();
        }
        
        // Redirect back to session detail
        window.location.href = document.referrer || '/';
    });
}

// Toggle screen sharing
async function toggleScreenSharing() {
    if (!peerConnection) {
        console.error('Peer connection not initialized');
        return false;
    }
    
    try {
        if (!isScreenSharing) {
            // Start screen sharing
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor'
                }
            });
            
            const screenTrack = screenStream.getVideoTracks()[0];
            
            // Get the video sender
            const videoSender = peerConnection.getSenders()
                .find(sender => sender.track && sender.track.kind === 'video');
            
            if (videoSender) {
                // Replace the camera track with the screen track
                await videoSender.replaceTrack(screenTrack);
                
                // When user stops sharing via browser UI
                screenTrack.onended = () => {
                    stopScreenSharing();
                };
                
                isScreenSharing = true;
                
                // Update UI
                const shareScreenBtn = document.getElementById('shareScreenBtn');
                if (shareScreenBtn) {
                    shareScreenBtn.innerHTML = '<i class="fas fa-times"></i>';
                    shareScreenBtn.classList.remove('btn-success');
                    shareScreenBtn.classList.add('btn-warning');
                }
                
                console.log('Screen sharing started');
            } else {
                console.error('No video sender found');
                return false;
            }
        } else {
            await stopScreenSharing();
        }
        
        return isScreenSharing;
    } catch (error) {
        console.error('Error in screen sharing:', error);
        return false;
    }
}

// Stop screen sharing
async function stopScreenSharing() {
    if (!isScreenSharing || !screenStream) {
        return;
    }
    
    try {
        // Stop all screen share tracks
        screenStream.getTracks().forEach(track => track.stop());
        
        // Get back the camera video track
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                // Get the video sender
                const videoSender = peerConnection.getSenders()
                    .find(sender => sender.track && sender.track.kind === 'video');
                
                if (videoSender) {
                    // Replace screen track with camera track
                    await videoSender.replaceTrack(videoTrack);
                }
            }
        }
        
        screenStream = null;
        isScreenSharing = false;
        
        // Update UI
        const shareScreenBtn = document.getElementById('shareScreenBtn');
        if (shareScreenBtn) {
            shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
            shareScreenBtn.classList.remove('btn-warning');
            shareScreenBtn.classList.add('btn-success');
        }
        
        console.log('Screen sharing stopped');
    } catch (error) {
        console.error('Error stopping screen share:', error);
    }
}