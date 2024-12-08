const mediasoup = require('mediasoup');
const logger = require('./logger');

let router;

const createRouter = async(worker) => {
    router = await worker.createRouter({
        mediaCodecs: [{
            kind: 'video',
            mimeType: 'video/VP8',
            clockRate: 90000,
            parameters: {},
        }, ],
    });
    logger.info('Router created');
    return router;
};

const getRouter = () => {
    if (!router) {
        throw new Error('Router not created yet');
    }
    return router;
};

module.exports = {
    createRouter,
    getRouter,
};