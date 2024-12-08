const child_process = require('child_process');
const logger = require('./logger');

const pipelines = new Map();

const startWebRTCPipeline = (rtspUrl, port) => {
    const command = `gst-launch-1.0 rtspsrc location=${rtspUrl} latency=200 ! rtph264depay ! h264parse ! rtph264pay config-interval=1 pt=96 ! udpsink host=127.0.0.1 port=${port}`;

    logger.info(`Starting WebRTC pipeline with command: ${command}`);

    const pipeline = child_process.exec(command, (err, stdout, stderr) => {
        if (err) {
            logger.error(`WebRTC Pipeline error: ${stderr}`);
            return;
        }
        logger.info(`WebRTC Pipeline stdout: ${stdout}`);
    });

    pipeline.on('exit', (code, signal) => {
        logger.info(`WebRTC Pipeline exited with code ${code} and signal ${signal}`);
    });

    pipeline.on('error', (err) => {
        logger.error(`WebRTC Pipeline error: ${err}`);
    });

    pipelines.set(rtspUrl, pipeline);
    return port;
};

const startRecordingPipeline = (rtspUrl, filePath) => {
    const command = `gst-launch-1.0 rtspsrc location=${rtspUrl} latency=200 ! rtph264depay ! h264parse ! mp4mux ! filesink location=${filePath}`;

    logger.info(`Starting recording pipeline with command: ${command}`);

    const pipeline = child_process.exec(command, (err, stdout, stderr) => {
        if (err) {
            logger.error(`Recording Pipeline error: ${stderr}`);
            return;
        }
        logger.info(`Recording Pipeline stdout: ${stdout}`);
    });

    pipeline.on('exit', (code, signal) => {
        logger.info(`Recording Pipeline exited with code ${code} and signal ${signal}`);
    });

    pipeline.on('error', (err) => {
        logger.error(`Recording Pipeline error: ${err}`);
    });

    pipelines.set(rtspUrl, pipeline);
    return filePath;
};

const stopPipeline = (rtspUrl) => {
    if (pipelines.has(rtspUrl)) {
        pipelines.get(rtspUrl).kill();
        pipelines.delete(rtspUrl);
        logger.info(`Pipeline for ${rtspUrl} stopped`);
    }
};

module.exports = {
    startWebRTCPipeline,
    startRecordingPipeline,
    stopPipeline,
};