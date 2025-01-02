const mediasoup = require('mediasoup');
const logger = require('./logger');

let router;

const createRouter = async(worker) => {
    router = await worker.createRouter({
        mediaCodecs: [{
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
            },
            {
                kind: 'video',
                mimeType: 'video/H264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '42e01f',
                    'level-asymmetry-allowed': 1,
                },
            },
        ],

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