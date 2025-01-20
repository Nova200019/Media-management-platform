import React, { useState, useEffect, useRef, useContext } from 'react';
import io from 'socket.io-client';
import FrontendUI from './FrontendUI';
import Hls from 'hls.js';
import { AuthContext } from './AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './App.css';
import axios from 'axios';

let socket;

function App() {
    const [cameras, setCameras] = useState([]);
    const [username, setUsername] = useState('');
    const [shareCameraId, setShareCameraId] = useState(null);
    const [shareUsername, setShareUsername] = useState('');
    const [loadingCamera, setLoadingCamera] = useState(null);
    const [recordingCameraId, setRecordingCameraId] = useState(null);
    const videoRefs = useRef({});
    const streamUrls = useRef({});
    const { isAuthenticated, isLoading, setIsAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            const token = localStorage.getItem('token');
            const decodedToken = jwtDecode(token);
            setUsername(decodedToken.data.username);

            socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
                extraHeaders: { Authorization: `Bearer ${token}` },
            });

            socket.emit('loadCameras', (loadedCameras) => setCameras(loadedCameras));

            socket.on('streamReady', ({ cameraId, streamUrl }) => {
                streamUrls.current[cameraId] = streamUrl;
                if (videoRefs.current[cameraId]) {
                    setupHlsPlayer(cameraId, streamUrl);
                }
            });

            return () => {
                socket.off('streamReady');
                socket.disconnect();
            };
        }
    }, [isAuthenticated]);

    const setupHlsPlayer = (cameraId, streamUrl) => {
        const videoElement = videoRefs.current[cameraId];
        if (!videoElement) return;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(videoElement);
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = streamUrl;
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleAddCamera = (camera) => {
        socket.emit('addCamera', camera, ({ success, camera }) => {
            if (success) setCameras((prev) => [...prev, camera]);
        });
    };

    const handleDeleteCamera = (cameraId) => {
        socket.emit('deleteCamera', { cameraId: cameraId.toString() }, (response) => {
            if (response.success) {
                setCameras((prev) => prev.filter((camera) => camera._id !== cameraId));
            }
        });
    };

    const handleStartStream = async (cameraId) => {
        try {
            console.log(`Starting stream for camera ID: ${cameraId}`); // Log camera ID
            setLoadingCamera(cameraId); // Indicate loading state
    
            // Emit startStream event to backend and await response
            const response = await new Promise((resolve, reject) => {
                console.log('Socket emitting startStream event...'); // Log before emitting
                socket.emit('startStream', { cameraId: cameraId.toString() }, (res) => {
                    console.log('Backend response:', res); // Log backend response
                    if (res.success) {
                        resolve(res);
                    } else {
                        reject(new Error(`Failed to start stream: ${res.error}`));
                    }
                });
            });
    
            // Wait for the stream URL to become available
            if (response.streamUrl) {
                console.log(`Stream URL received: ${response.streamUrl}`); // Log the stream URL
                await waitForStream(response.streamUrl);
                setupHlsPlayer(cameraId, response.streamUrl); // Initialize HLS player
            } else {
                console.warn(`No stream URL returned for camera ID ${cameraId}`);
            }
        } catch (error) {
            console.error(`Error starting stream for camera ${cameraId}:`, error);
            alert(`Failed to start stream for camera ID ${cameraId}.`);
        } finally {
            setLoadingCamera(null); // Clear loading state
        }
    };    

    const handleStopStream = (cameraId) => {
        socket.emit('stopStream', { cameraId: cameraId.toString() }, (response) => {
            if (response.success) {
                const videoElement = videoRefs.current[cameraId];
                if (videoElement) {
                    videoElement.pause();
                    videoElement.src = '';
                }
            }
        });
    };

    const handleRecordStream = (cameraId) => {
        const isRecording = recordingCameraId === cameraId;
        socket.emit('recordStream', { cameraId: cameraId.toString(), toggle: true }, (response) => {
            if (response.success) {
                setRecordingCameraId(isRecording ? null : cameraId);
            }
        });
    };

    const handleShareCamera = (cameraId, username) => {
        socket.emit('shareCamera', { cameraId: cameraId.toString(), username }, (response) => {
            if (response.success) {
                setShareCameraId(null);
                setShareUsername('');
                alert(`Camera shared with ${username} successfully!`);
            } else {
                alert(`Failed to share camera with ${username}`);
            }
        });
    };

    const waitForStream = async (streamUrl, maxRetries = 10, interval = 2000) => {
        let retries = 0;
        while (retries < maxRetries) {
            try {
                const response = await axios.head(streamUrl);
                if (response.status === 200) return true;
            } catch {}
            retries++;
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        throw new Error('Stream not ready after maximum retries');
    };

    return isAuthenticated ? (
        <FrontendUI
            handleLogout={handleLogout}
            cameras={cameras}
            onAddCamera={handleAddCamera}
            onDeleteCamera={handleDeleteCamera}
            onStartStream={handleStartStream}
            onStopStream={handleStopStream}
            onRecordStream={handleRecordStream}
            onShareCamera={handleShareCamera}
        />
    ) : (
        <Navigate to="/login" />
    );
}

export default App;
