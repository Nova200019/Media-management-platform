import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AddCameraForm from './components/AddCameraForm';
import CameraConsole from './components/CameraConsole';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');

function App() {
    const [cameras, setCameras] = useState([]);

    useEffect(() => {
        socket.emit('loadCameras', (loadedCameras) => setCameras(loadedCameras));
    }, []);

    const handleAddCamera = (camera) => {
        socket.emit('addCamera', camera, ({ success, camera }) => {
            if (success) setCameras((prev) => [...prev, camera]);
        });
    };

    const handleStartStream = (cameraId) => {
        socket.emit('startStream', { cameraId: cameraId.toString() }, async(response) => {
            if (response.success) {
                console.log(`Stream started on port ${response.port}`);
                const videoElement = document.getElementById(`video-${cameraId}`);
                if (videoElement) {
                    const stream = await getWebRTCStream(cameraId);
                    videoElement.srcObject = stream;
                    videoElement.play();
                }
            } else {
                console.error('Failed to start stream');
            }
        }); // Handle the answer from the server
    };

    const handleStopStream = (cameraId) => {
        socket.emit('stopStream', { cameraId: cameraId.toString() }, (response) => {
            if (response.success) {
                console.log('Stream stopped');
                const videoElement = document.getElementById(`video-${cameraId}`);
                if (videoElement) {
                    videoElement.pause();
                    videoElement.srcObject = null;
                }
            } else {
                console.error('Failed to stop stream');
            }
        });
    };

    const handleRecordStream = (cameraId) => {
        socket.emit('recordStream', { cameraId: cameraId.toString(), toggle: true }, (response) => {
            if (response.success) {
                console.log(`Recording started, file path: ${response.filePath}`);
            } else {
                console.error('Failed to start recording');
            }
        });
    };

    return ( <
        div >
        <
        h1 > Camera Management < /h1> <
        AddCameraForm onAdd = { handleAddCamera }
        /> <
        div > {
            cameras.map((camera) => ( <
                div key = { camera._id } >
                <
                CameraConsole camera = { camera }
                onStart = { handleStartStream }
                onStop = { handleStopStream }
                onRecord = { handleRecordStream }
                /> <
                video id = { `video-${camera._id}` }
                width = "640"
                height = "480"
                controls / >
                <
                /div>
            ))
        } <
        /div> < /
        div >
    );
}

async function getWebRTCStream(cameraId) {
    const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate:', event.candidate);
            socket.emit('iceCandidate', { cameraId, candidate: event.candidate });
        }
    };

    // Handle track event
    peerConnection.ontrack = (event) => {
        const videoElement = document.getElementById(`video-${cameraId}`);
        if (videoElement) {
            videoElement.srcObject = event.streams[0];
        }
    };

    // Create an offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Wait for the local description to be set
    await new Promise((resolve) => {
        peerConnection.onicegatheringstatechange = (event) => {
            if (peerConnection.iceGatheringState === 'complete') {
                resolve();
            }
        };
    });

    // Print the SDP offer
    console.log('SDP Offer:', peerConnection.localDescription.sdp);

    // Send the offer to the server
    console.log('Sending WebRTC offer:', peerConnection.localDescription);
    socket.emit('webrtcOffer', { cameraId, offer: peerConnection.localDescription });

    // Handle the answer from the server
    socket.on('webrtcAnswer', async({ answer }) => {
        console.log('Received WebRTC answer:', answer);
        console.log('SDP Answer:', answer.sdp);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Handle ICE candidates from the server
    socket.on('iceCandidate', async({ candidate }) => {
        try {
            console.log('Received ICE candidate:', candidate);
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    });

    return peerConnection;
}

export default App;