const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const logger = require('./logger');
const { startWebRTCPipeline, startRecordingPipeline, stopPipeline } = require('./cameraManager');
const mediasoup = require('mediasoup');
const mediasoupConfig = require('./mediasoupConfig');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const io = socketIo(server, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
    }
});

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/mediasoup';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
const CameraSchema = new mongoose.Schema({ name: String, rtspUrl: String });
const Camera = mongoose.model('Camera', CameraSchema);

let worker;
let router;

(async() => {
    worker = await mediasoup.createWorker(mediasoupConfig.worker);
    router = await worker.createRouter({ mediaCodecs: mediasoupConfig.router.mediaCodecs });
    logger.info('MediaSoup router created');
})();

// Simple hash function to generate a unique integer from a string
const hashStringToInt = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

// Function to generate a port number within a specific range
const generatePort = (cameraId) => {
    const basePort = 5000;
    const range = 1000; // Port range from 5000 to 5999
    const hash = hashStringToInt(cameraId.toString());
    return basePort + (hash % range);
};

// Socket.io handlers
io.on('connection', (socket) => {
    logger.info('Client connected');

    // Handle WebRTC offer
    socket.on('webrtcOffer', async({ cameraId, offer }) => {
        logger.info(`Received WebRTC offer for cameraId: ${cameraId}`);
        logger.info(`Offer SDP: ${offer.sdp}`);
        const camera = await Camera.findById(cameraId);
        if (!camera) {
            logger.error('Camera not found');
            return socket.emit('error', { error: 'Camera not found' });
        }

        const transport = await router.createWebRtcTransport(mediasoupConfig.webRtcTransport);
        logger.info('WebRTC transport created');

        await transport.connect({ dtlsParameters: offer.dtlsParameters });
        logger.info('WebRTC transport connected');

        const producer = await transport.produce({
            kind: 'video',
            rtpParameters: offer.rtpParameters,
        });
        logger.info('WebRTC producer created');

        socket.emit('webrtcAnswer', { answer: transport.dtlsParameters });
        logger.info('Sent WebRTC answer');
        logger.info(`Answer SDP: ${transport.dtlsParameters.sdp}`);
    });

    // Handle ICE candidates
    socket.on('iceCandidate', async({ cameraId, candidate }) => {
        logger.info(`Received ICE candidate for cameraId: ${cameraId}`);
        logger.info(`Candidate: ${JSON.stringify(candidate)}`);
        const camera = await Camera.findById(cameraId);
        if (!camera) {
            logger.error('Camera not found');
            return socket.emit('error', { error: 'Camera not found' });
        }

        const transport = await router.createWebRtcTransport(mediasoupConfig.webRtcTransport);

        await transport.addIceCandidate(candidate);
        logger.info('Added ICE candidate to transport');
    });

    // Get all cameras on load
    socket.on('loadCameras', async(callback) => {
        const cameras = await Camera.find();
        callback(cameras);
    });

    // Add new camera
    socket.on('addCamera', async({ name, rtspUrl }, callback) => {
        const camera = new Camera({ name, rtspUrl });
        await camera.save();
        callback({ success: true, camera });
    });

    // Start stream
    socket.on('startStream', async({ cameraId }, callback) => {
        const camera = await Camera.findById(cameraId);
        if (!camera) return callback({ error: 'Camera not found' });

        const port = generatePort(cameraId.toString()); // Generate port within a specific range
        logger.info(`Starting stream on port ${port} for cameraId: ${cameraId}`);
        startWebRTCPipeline(camera.rtspUrl, port);
        callback({ success: true, port });
    });

    // Stop stream
    socket.on('stopStream', async({ cameraId }, callback) => {
        const camera = await Camera.findById(cameraId);
        if (!camera) return callback({ error: 'Camera not found' });

        stopPipeline(camera.rtspUrl);
        callback({ success: true });
    });

    // Record stream
    socket.on('recordStream', async({ cameraId, toggle }, callback) => {
        const camera = await Camera.findById(cameraId);
        if (!camera) return callback({ error: 'Camera not found' });

        if (toggle) {
            const filePath = `./gstreamer/recordings/${cameraId}-${Date.now()}.mp4`;
            startRecordingPipeline(camera.rtspUrl, filePath);
            callback({ success: true, filePath });
        } else {
            stopPipeline(camera.rtspUrl);
            callback({ success: true });
        }
    });
});

server.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));