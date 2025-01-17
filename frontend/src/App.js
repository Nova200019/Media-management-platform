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
    const [shareCameraId, setShareCameraId] = useState(null);
    const [shareUsername, setShareUsername] = useState('');
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

    const handleDeleteCamera = (cameraId) => {
        socket.emit('deleteCamera', { cameraId: cameraId.toString() }, (response) => {
            if (response.success) {
                setCameras((prev) => prev.filter((camera) => camera._id !== cameraId));
                console.log(`Camera ${cameraId} deleted successfully`);
            } else {
                console.error('Failed to delete camera');
            }
        });
    };

    const handleShareCamera = (cameraId, username) => {
        socket.emit('shareCamera', { cameraId: cameraId.toString(), username }, (response) => {
            if (response.success) {
                console.log(`Camera ${cameraId} shared with ${username}`);
                setShareCameraId(null);
                setShareUsername('');
            } else {
                console.error('Failed to share camera');
            }
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

    const handleOpenShareBox = (cameraId) => {
        if (shareCameraId === cameraId) {
            setShareCameraId(null);
        } else {
            setShareCameraId(cameraId);
        }
    };

    const handleShareInputChange = (e) => {
        setShareUsername(e.target.value);
    };

    const handleShareSubmit = (e) => {
        e.preventDefault();
        if (shareCameraId && shareUsername) {
            handleShareCamera(shareCameraId, shareUsername);
        }
    };

    if (isLoading)
        return (
            <div>Loading...</div>
        );

    return (isAuthenticated ? (
        <div>
            <h1>Camera Management</h1>
            <p>Welcome, {username}!</p>
            <button onClick={handleLogout}>Logout</button>
            <AddCameraForm onAdd={handleAddCamera} />
            <div>
                {cameras.map((camera) => (
                    <div key={camera._id}>
                        <CameraConsole camera={camera} onStart={handleStartStream} onStop={handleStopStream} onRecord={handleRecordStream} onDelete={handleDeleteCamera} />
                        <video ref={(el) => (videoRefs.current[camera._id] = el)} id={`video-${camera._id}`} width="640" height="480" controls />
                            <br />
                        <button onClick={() => handleOpenShareBox(camera._id)}>
                            {shareCameraId === camera._id ? 'Cancel' : 'Share'}
                        </button>
                        {shareCameraId === camera._id && (
                            <div>
                                <form onSubmit={handleShareSubmit}>
                                    <input type="text" value={shareUsername} onChange={handleShareInputChange} placeholder="Enter username to share with" />
                                    <button type="submit">Share</button>
                                </form>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    ) : (<Navigate to="/login" />)
    );
}

export default App;
