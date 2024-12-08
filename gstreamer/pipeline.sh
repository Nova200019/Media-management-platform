const { exec } = require('child_process');
const logger = require('./logger');

const pipelines = new Map();

const startPipeline = (rtspUrl, router, filePath, record = false) => {
    const port = 5000 + pipelines.size;
    const command = `bash /c:/Users/soumy/Desktop/MMP/gstreamer/pipeline.sh start_pipeline "${rtspUrl}" ${port} "${filePath}" ${record}`;

    const pipeline = exec(command, (err, stdout, stderr) => {
        if (err) {
            logger.error(`Pipeline error: ${stderr}`);
            return;
        }
        logger.info(`Pipeline started with PID: ${stdout.trim()}`);
    });

    pipelines.set(rtspUrl, pipeline);
    return port;
};

const stopPipeline = (rtspUrl) => {
    if (pipelines.has(rtspUrl)) {
        const pipeline = pipelines.get(rtspUrl);
        const command = `bash /c:/Users/soumy/Desktop/MMP/gstreamer/pipeline.sh stop_pipeline ${pipeline.pid}`;

        exec(command, (err, stdout, stderr) => {
            if (err) {
                logger.error(`Pipeline stop error: ${stderr}`);
                return;
            }
            logger.info(`Pipeline for ${rtspUrl} stopped`);
        });

        pipelines.delete(rtspUrl);
    }
};

module.exports = {
    startPipeline,
    stopPipeline,
};
