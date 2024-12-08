const mediasoup = require('mediasoup');
const logger = require('./logger');


let worker;

const createWorker = async() => {
    worker = await mediasoup.createWorker({
        logLevel: 'debug',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
    });

    worker.on('died', () => {
        logger.error('Mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
        setTimeout(() => process.exit(1), 2000);
    });

    logger.info('Mediasoup worker created [pid:%d]', worker.pid);
    return worker;
};

module.exports = { createWorker };