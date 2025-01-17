import React, { useState, useEffect, useRef, useContext } from 'react';
import io from 'socket.io-client';
import AddCameraForm from './components/AddCameraForm';
import CameraConsole from './components/CameraConsole';
import Hls from 'hls.js';
import { AuthContext } from './AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

let socket;
function App() {
    const [cameras, setCameras] = useState([]);
    const [username, setUsername] = useState('');
    const videoRefs = useRef({}); // Store references to video elements
    const streamUrls = useRef({}); // Store stream URLs by cameraId
    const { isAuthenticated, isLoading, setIsAuthenticated } = useContext(AuthContext);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();   
    

    useEffect(() => {
        // Redirect to /login if user is not authenticated after loading
        if (!isLoading && !isAuthenticated) {
            console.log('User is not authenticated, redirecting to /login.');
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]); 

    useEffect(() => {
        if (isAuthenticated) {
            const token = localStorage.getItem('token');
            const decodedToken = jwtDecode(token);
            setUsername(decodedToken.data.username);
            // Connect to the server using the token
            socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
                extraHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Load existing cameras from backend on mount
            socket.emit('loadCameras', (loadedCameras) => setCameras(loadedCameras));

            // Listen for streamReady socket event
            socket.on('streamReady', ({ cameraId, streamUrl }) => {
                console.log(`Stream ready for camera ${cameraId}: ${streamUrl}`);
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

    const handleStartStream = (cameraId) => {
        socket.emit('startStream', { cameraId: cameraId.toString() }, (response) => {
            if (response.success) {
                console.log(`Stream started for camera ${cameraId}`);
            } else {
                console.error('Failed to start stream');
            }
        });
    };

    const handleStopStream = (cameraId) => {
        socket.emit('stopStream', { cameraId: cameraId.toString() }, (response) => {
            if (response.success) {
                console.log('Stream stopped');
                const videoElement = videoRefs.current[cameraId];
                if (videoElement) {
                    videoElement.pause();
                    videoElement.src = '';
                }
            } else {
                console.error('Failed to stop stream');
            }
        });
    };

    const handleRecordStream = (cameraId) => {
        socket.emit('recordStream', { cameraId: cameraId.toString(), toggle: true }, (response) => {
            if (response.success) {
                console.log(`Recording started for ${cameraId}`);
            } else {
                console.error('Failed to start recording');
            }
        });
    };

    const setupHlsPlayer = (cameraId, streamUrl) => {
        const videoElement = videoRefs.current[cameraId];

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play();
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
                console.error('HLS error:', data);
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = streamUrl;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play();
            });
        }
    };

    if(isLoading)
        return(
            <div>Loading...</div>
    )

    return ( isAuthenticated ? (
        <div>
            <h1>Camera Management</h1>
            <p>Welcome, {username}!</p>
            <button onClick={handleLogout}>Logout</button>
            <AddCameraForm onAdd={handleAddCamera} />
            <div>
                {cameras.map((camera) => (
                    <div key={camera._id}>
                        <CameraConsole camera={camera} onStart={handleStartStream} onStop={handleStopStream} onRecord={handleRecordStream} />
                        <video ref={(el) => (videoRefs.current[camera._id] = el)} id={`video-${camera._id}`} width="640" height="480" controls />
                    </div>
                ))}
            </div>
        </div>
    ) : (  <Navigate to="/login" />)
)}

export default App;
