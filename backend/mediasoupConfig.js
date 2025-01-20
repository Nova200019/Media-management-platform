const os = require('os');

const mediasoupConfig = {
    // Worker settings
    worker: {
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
        logLevel: 'warn',
        logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'srtp',
            'rtcp',
        ],
    },

    // Router settings
    router: {
        mediaCodecs: [{
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
            },
            {
                kind: 'video',
                mimeType: 'video/H264', // Keep H264 support
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '42e01f',
                    'level-asymmetry-allowed': 1,
                },
            },
        ],
    },


    // WebRtcTransport settings
    webRtcTransport: {
        listenIps: [{
            ip: '0.0.0.0',
            announcedIp: null, // Replace with public IP if NAT
        }, ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 1000000,
    },
};

module.exports = mediasoupConfig;