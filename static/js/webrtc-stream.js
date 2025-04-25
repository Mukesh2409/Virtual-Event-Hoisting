// WebRTC Stream Handler Implementation
let peerConnections = new Map(); // Store multiple peer connections
let mediaRecorder;
let recordedChunks = [];

// Enhanced STUN/TURN configuration for better connectivity
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
};

// Media stream constraints for high quality
const streamConstraints = {
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2
    },
    video: {
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
        frameRate: { ideal: 30, max: 60 },
        aspectRatio: 16/9
    }
};

// Initialize stream handler for organizer
async function initOrganizerStream(roomId) {
    try {
        // Get high-quality media stream
        const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
        
        // Set up media recorder for stream backup
        setupMediaRecorder(stream);
        
        // Display local preview
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = stream;
        }
        
        return stream;
    } catch (error) {
        console.error('Error initializing organizer stream:', error);
        throw error;
    }
}

// Initialize stream handler for attendee
async function initAttendeeStream(roomId, organizerId) {
    try {
        // Create peer connection for this attendee
        const peerConnection = new RTCPeerConnection(configuration);
        peerConnections.set(organizerId, peerConnection);
        
        // Handle incoming tracks
        peerConnection.ontrack = (event) => {
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };
        
        // Set up connection monitoring
        setupConnectionMonitoring(peerConnection, organizerId);
        
        return peerConnection;
    } catch (error) {
        console.error('Error initializing attendee stream:', error);
        throw error;
    }
}

// Set up media recorder for stream backup
function setupMediaRecorder(stream) {
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 3000000, // 3 Mbps
        audioBitsPerSecond: 128000 // 128 kbps
    });
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.start(1000); // Record in 1-second chunks
}

// Monitor and maintain connection quality
function setupConnectionMonitoring(peerConnection, peerId) {
    peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        console.log(`Connection state with ${peerId}:`, state);
        
        if (state === 'failed' || state === 'disconnected') {
            handleConnectionFailure(peerConnection, peerId);
        }
    };
    
    // Monitor connection stats
    setInterval(() => {
        monitorConnectionStats(peerConnection, peerId);
    }, 3000);
}

// Handle connection failures
async function handleConnectionFailure(peerConnection, peerId) {
    try {
        // Close existing connection
        peerConnection.close();
        peerConnections.delete(peerId);
        
        // Attempt to reconnect
        const newConnection = await initAttendeeStream(roomId, peerId);
        peerConnections.set(peerId, newConnection);
        
    } catch (error) {
        console.error('Error handling connection failure:', error);
    }
}

// Monitor connection statistics
async function monitorConnectionStats(peerConnection, peerId) {
    try {
        const stats = await peerConnection.getStats();
        let videoStats = null;
        let audioStats = null;
        
        stats.forEach(stat => {
            if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
                videoStats = stat;
            } else if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
                audioStats = stat;
            }
        });
        
        if (videoStats) {
            const videoBitrate = calculateBitrate(videoStats);
            adjustVideoQuality(peerConnection, videoBitrate);
        }
        
        if (audioStats) {
            const audioBitrate = calculateBitrate(audioStats);
            adjustAudioQuality(peerConnection, audioBitrate);
        }
        
    } catch (error) {
        console.error('Error monitoring stats:', error);
    }
}

// Calculate bitrate from stats
function calculateBitrate(stats) {
    const now = performance.now();
    if (stats.lastBitrateCalculation) {
        const duration = now - stats.lastBitrateCalculation.timestamp;
        const bytes = stats.bytesReceived - stats.lastBitrateCalculation.bytes;
        return (bytes * 8) / duration; // bits per millisecond
    }
    
    stats.lastBitrateCalculation = {
        timestamp: now,
        bytes: stats.bytesReceived
    };
    return null;
}

// Dynamically adjust video quality
async function adjustVideoQuality(peerConnection, currentBitrate) {
    const sender = peerConnection.getSenders()
        .find(s => s.track && s.track.kind === 'video');
    
    if (sender) {
        const params = sender.getParameters();
        if (!params.encodings) {
            params.encodings = [{}];
        }
        
        // Adjust quality based on bitrate
        if (currentBitrate < 500000) { // < 500 kbps
            params.encodings[0].maxBitrate = 800000; // 800 kbps
            params.encodings[0].scaleResolutionDownBy = 2.0;
        } else if (currentBitrate < 1500000) { // < 1.5 Mbps
            params.encodings[0].maxBitrate = 2000000; // 2 Mbps
            params.encodings[0].scaleResolutionDownBy = 1.5;
        } else {
            params.encodings[0].maxBitrate = 3000000; // 3 Mbps
            params.encodings[0].scaleResolutionDownBy = 1.0;
        }
        
        await sender.setParameters(params);
    }
}

// Dynamically adjust audio quality
async function adjustAudioQuality(peerConnection, currentBitrate) {
    const sender = peerConnection.getSenders()
        .find(s => s.track && s.track.kind === 'audio');
    
    if (sender) {
        const params = sender.getParameters();
        if (!params.encodings) {
            params.encodings = [{}];
        }
        
        // Adjust quality based on bitrate
        if (currentBitrate < 24000) { // < 24 kbps
            params.encodings[0].maxBitrate = 32000; // 32 kbps
        } else if (currentBitrate < 64000) { // < 64 kbps
            params.encodings[0].maxBitrate = 96000; // 96 kbps
        } else {
            params.encodings[0].maxBitrate = 128000; // 128 kbps
        }
        
        await sender.setParameters(params);
    }
}

// Export functions
window.initOrganizerStream = initOrganizerStream;
window.initAttendeeStream = initAttendeeStream;