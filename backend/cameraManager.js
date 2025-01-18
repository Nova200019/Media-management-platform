const child_process = require('child_process');
const logger = require('./logger');

const pipelines = new Map();

const startHLSPipeline = (rtspUrl, outputPath, cameraName) => {
    const command = `gst-launch-1.0 rtspsrc location=${rtspUrl} latency=300 ! decodebin ! videoconvert ! x264enc tune=zerolatency speed-preset=superfast ! h264parse ! mpegtsmux ! hlssink playlist-location=${outputPath}/output.m3u8 location=${outputPath}/segment_%05d.ts target-duration=5 max-files=10`;

    logger.info(`Starting HLS pipeline for ${cameraName} with command: ${command}`);

    const pipeline = child_process.exec(command, (err, stdout, stderr) => {
        if (err) {
            logger.error(`Pipeline error for ${cameraName}: ${stderr}`);
            return;
        }
        logger.info(`Pipeline stdout for ${cameraName}: ${stdout}`);
    });

    pipeline.on('exit', (code, signal) => {
        logger.info(`Pipeline for ${cameraName} exited with code ${code} and signal ${signal}`);
    });

    pipeline.on('error', (err) => {
        logger.error(`Pipeline error for ${cameraName}: ${err}`);
    });

    pipelines.set(rtspUrl, pipeline);
};

const startRecordingPipeline = (rtspUrl, filePath) => {
  const command = `gst-launch-1.0 rtspsrc location=${rtspUrl} latency=1000 protocols=4 do-retransmission=true ! ` +
        `rtpjitterbuffer do-lost=true ! rtph264depay ! capsfilter caps="video/x-h264,stream-format=(string)avc,alignment=(string)au" ! ` +
        `h264parse ! mpegtsmux ! filesink location=${filePath}`;
    logger.info(`Starting recording pipeline with command: ${command}`);

    // Execute the pipeline
    const pipeline = child_process.exec(command, (err, stdout, stderr) => {
        if (err) {
            logger.error(`Recording Pipeline error: ${stderr}`);
            return;
        }
        logger.info(`Recording Pipeline stdout: ${stdout}`);
    });

    // Attach event listeners
    pipeline.on('exit', (code, signal) => {
        logger.info(`Recording Pipeline exited with code ${code} and signal ${signal}`);
    });

    pipeline.on('error', (err) => {
        logger.error(`Recording Pipeline error: ${err}`);
    });

    // Store the pipeline for later control (e.g., stop it)
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
    startHLSPipeline,
    stopPipeline,
    startRecordingPipeline,
};