import React, { useState, useEffect, useRef, useContext } from 'react';
import io from 'socket.io-client';
import AddCameraForm from './components/AddCameraForm';
import CameraConsole from './components/CameraConsole';
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
    const [loadingCamera, setLoadingCamera] = useState(null); // Tracks camera loading state
    const [recordingCameraId, setRecordingCameraId] = useState(null); // Tracks recording state
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
                alert(`Camera shared with ${username} successfully!`);
            } else {
                console.error('Failed to share camera');
                alert(`Failed to share camera with ${username}: ${response.error || 'Unknown error'}`);
            }
        });
    };

    const handleStartStream = async(cameraId) => {
        setLoadingCamera(cameraId); // Show spinner for this camera
        const camera = cameras.find((cam) => cam._id === cameraId);

        socket.emit('startStream', { cameraId: cameraId.toString() }, async(response) => {
            if (response.success) {
                console.log(`Stream started for camera ${cameraId}`);
                try {
                    // Wait for the stream URL or output.m3u8 file to become available
                    await waitForStream(response.streamUrl);
                    console.log(`Stream ready for camera ${cameraId}`);
                    setupHlsPlayer(cameraId, response.streamUrl); // Set up the player with the stream URL
                } catch (err) {
                    console.error(`Failed to prepare stream for camera ${cameraId}: ${err}`);
                }
                setLoadingCamera(null); // Remove spinner
            } else {
                console.error('Failed to start stream');
                setLoadingCamera(null); // Remove spinner on failure
            }
        });
    };

    const waitForStream = async(streamUrl, maxRetries = 10, interval = 2000) => {
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const response = await axios.head(streamUrl); // Check if the stream URL is available
                if (response.status === 200) {
                    return true; // Stream is available
                }
            } catch (err) {
                console.log(`Stream not ready, retrying in ${interval / 1000} seconds...`);
            }

            retries++;
            await new Promise((resolve) => setTimeout(resolve, interval));
        }

        throw new Error('Stream not ready after maximum retries');
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
        // Check if the current camera is being recorded
        const isRecording = recordingCameraId === cameraId;

        // Emit record toggle event to the server
        socket.emit('recordStream', { cameraId: cameraId.toString(), toggle: true }, (response) => {
            if (response.success) {
                // Update the state to toggle recording
                setRecordingCameraId(isRecording ? null : cameraId);
            } else {
                alert('Failed to toggle recording');
            }
        });
    };

const setupHlsPlayer = (cameraId, streamUrl) => {
    const videoElement = videoRefs.current[cameraId];

    // Ensure video element is available
    if (!videoElement) {
        console.error(`Video element for camera ${cameraId} is not available.`);
        return;
    }

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (videoElement) {
                videoElement.play().catch((err) => {
                    console.error('Error while trying to play the video:', err);
                });
            }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
            console.error('HLS error:', data);
        });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = streamUrl;
        videoElement.addEventListener('loadedmetadata', () => {
            videoElement
                .play()
                .catch((err) => console.error('Error while trying to play the video:', err));
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
        return ( <
            div > Loading... < /div>
        );


    return isAuthenticated ? (
    <div className="App">
        {/* Header Section */}
        <div className="header">
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <h1 className="app-title">Media Management Platform</h1> {/* App Title */}
                <div className="vertical-separator"></div>
                <div style={{display: "flex", alignItems: "center"}}>
                    <p>Welcome, {username}!</p>
                    <div className="vertical-separator"></div>
                    <button className="logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
        {/* Add Camera Form */}
        <AddCameraForm onAdd={handleAddCamera} />
        {/* Camera Grid */}
        <div className="camera-grid">
            {cameras.map((camera, index) => (
                <React.Fragment key={camera._id}>
                    <div className="camera-console">
                        <h3>{camera.name}</h3>

                                <video
                                    ref={(el) => {
                                        if (el && !videoRefs.current[camera._id]) {
                                            videoRefs.current[camera._id] = el; // Assign video element
                                            if (streamUrls.current[camera._id]) {
                                                setupHlsPlayer(camera._id, streamUrls.current[camera._id]); // Initialize HLS player if the stream URL exists
                                            }
                                        }
                                    }}
                                    width="300"
                                    height="200"
                                    controls
                                ></video>
                        <div className="actions">
                            <button onClick={() => handleStartStream(camera._id)}>
                                Start Stream
                            </button>
                            <button onClick={() => handleStopStream(camera._id)}>
                                Stop Stream
                            </button>
                            <button
                                onClick={() => handleRecordStream(camera._id)}
                                className={`record-button ${
                                    recordingCameraId === camera._id ? "recording" : ""
                                }`}
                            >
                                <span className="led"></span>
                                {recordingCameraId === camera._id
                                    ? "Stop Recording"
                                    : "Record Stream"}
                            </button>
                            <button onClick={() => handleDeleteCamera(camera._id)}>
                                Delete Camera
                            </button>
                            <button onClick={() => handleOpenShareBox(camera._id)}>
                            {shareCameraId === camera._id ? 'Cancel' : 'Share'}
                        </button>
                        {shareCameraId === camera._id && (
                            <div>
                                <form onSubmit={handleShareSubmit}>
                                    <input type="text" value={shareUsername} onChange={handleShareInputChange}
                                           placeholder="Enter username to share with"/>
                                    <button type="submit">Share</button>
                                </form>
                            </div>
                        )}
                        </div>

                    </div>

                    {/* Add Separator After Every Three Consoles */}
                    {(index + 1) % 3 === 0 && index + 1 < cameras.length && (
                        <div className="separator-line-grid"></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    </div>
    ) : (
        <Navigate to="/login"/>
    );
}

export default App;