const mediasoup = require('mediasoup');
const logger = require('./logger');
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

let routerInstance;

const createRouter = async (worker) => {
    routerInstance = await worker.createRouter({
        mediaCodecs: [
            {
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
    return routerInstance;
};

const getRouter = () => {
    if (!routerInstance) {
        throw new Error('Router not created yet');
    }
    return routerInstance;
};

router.get('/logs', (req, res) => {
    console.log('Logs endpoint hit');
    const logFilePath = path.join(__dirname, 'system.log');

    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            logger.error('Failed to read log file:', err);
            return res.status(500).json({ error: 'Unable to fetch logs' });
        }

        const logs = data
            .trim()
            .split('\n')
            .map(line => {
                try {
                    const logEntry = JSON.parse(line);
                    return {
                        timestamp: logEntry.timestamp,
                        level: logEntry.level,
                        message: logEntry.message,
                    };
                } catch (err) {
                    logger.error('Invalid log entry:', line);
                    return null; // Skip invalid lines
                }
            })
            .filter(entry => entry !== null);

        res.json(logs);
    });
});

module.exports = {
    createRouter,
    getRouter,
    router, // Export the express router
};
