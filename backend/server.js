const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const logger = require('./logger');
const { startHLSPipeline, stopPipeline, startRecordingPipeline} = require('./cameraManager');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const passport = require('passport');
const passportJwt = require('passport-jwt')
const req = require('express/lib/request');
const jwt = require('jsonwebtoken')
const cors = require('cors');
const { Logger } = require('winston');
const mysql = require('mysql2');
const { v4: uuidv4 } = require('uuid');

const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;
const jwtSecret = process.env.JWT_SECRET || 'defaultSecret';

const app = express();

//App config

app.use(bodyParser.json()); //Allows req.body.ATTRIBUTE to be read out
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
const buildPath = path.join(__dirname, 'frontend/build');
app.use(express.static(buildPath));

// Handle preflight (OPTIONS) requests explicitly
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*'); // Frontend origin
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow Authorization header
    res.sendStatus(200); // Respond with a 200 OK for OPTIONS requests
});


const server = http.createServer(app);
const PORT = process.env.PORT || 3000; //Changed port to 80
const io = socketIo(server, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
    }
});

// JWT strategy options
const jwtDecodeOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
};

// Configure passport to use JWT strategy
passport.use(
    new JwtStrategy(jwtDecodeOptions, (payload, done) => {
        const user = findUser(payload.data.username);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    }),
);

// Use passport middleware
io.engine.use((req, res, next) => {
    const isHandshake = req._query.sid === undefined;
    if (isHandshake) {
        passport.authenticate("jwt", { session: false })(req, res, next);
    } else {
        next();
    }
});

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/mediasoup';
mongoose.connect(mongoUri);
const CameraSchema = new mongoose.Schema({ name: String, rtspUrl: String, userID: String });
const Camera = mongoose.model('Camera', CameraSchema);

const STREAM_VOLUME_PATH = process.env.STREAM_VOLUME_PATH || '/video-storage';
const STREAM_BASE_URL = process.env.STREAM_BASE_URL || 'http://localhost:3000';

// MySQL connection
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'yourpassword',
    database: process.env.MYSQL_DATABASE || 'user_management',
    port: process.env.MYSQL_PORT || 3306
});

// Connect to MySQL database
db.connect((err) => {
    if (err) {
        logger.info('Error connecting to the MySQL database:', err);
        return;
    }
    logger.info('Connected to the MySQL database.');

    // Create users table if it doesn't exist
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          uuid VARCHAR(36) NOT NULL UNIQUE,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL
      )
  `;
    db.query(createUsersTable, (err, results) => {
        if (err) {
            logger.info('Error creating users table:', err);
        } else {
            logger.info('Users table created or already exists');
        }
    });
});

// Serve HLS streams
// CORS middleware for /streams route
app.use('/streams', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    const decodedPath = decodeURIComponent(req.url);
    req.url = decodedPath;
    next();
}, express.static(STREAM_VOLUME_PATH));


// Serve frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "build/index.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "build/index.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "build/index.html"));
});

// Verify JWT token
app.get(
    "/self",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        if (req.user) {
            res.status(200).send(req.user);
        } else {
            res.status(401).end();
        }
    },
);


//FOR TESTING PURPOSES:
app.get("/users", (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            logger.info('Error querying database:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});


app.get('/cameras', async(req, res) => {
    try {
        const cameras = await Camera.find();
        res.status(200).json(cameras);
    } catch (error) {
        logger.info('Error fetching cameras:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Function to find user in MySQL database
async function findUser(username) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
            if (err) {
                logger.info('Error querying database:', err);
                return reject(err);
            }
            resolve(results[0]);
        });
    });
}

// API route for user authentication
app.post("/login", async(req, res) => {
    // Check if user exists
    const user = await findUser(req.body.username);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }
    try {
        // Check if password is correct
        if (await bcrypt.compare(req.body.password, user.password)) {
            logger.info("Authentication OK");
            const token = jwt.sign({
                    data: { username: user.username, userID: user.uuid },
                },
                jwtSecret, {
                    expiresIn: "24h",
                },
            );
            // Send token to client
            res.status(200).json({ token });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (e) {
        res.status(401).json({ message: 'Invalid credentials.' });
    }
});

// API route for user registration
app.post('/register', async(req, res) => {
    try {
        // Check if user already exists
        const existingUser = await findUser(req.body.username);
        if (existingUser) {
            logger.info('User already exists');
            return res.status(409).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const uuid = uuidv4();
        const newUser = {
            username: req.body.username,
            password: hashedPassword,
            uuid: uuid
        };
        //Insert user into database
        db.query('INSERT INTO users (uuid, username, password) VALUES (?, ?, ?)', [newUser.uuid, newUser.username, newUser.password], (err, results) => {
            if (err) {
                logger.info('Error inserting user into database:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            // Generate JWT token
            const token = jwt.sign({
                    data: { username: newUser.username, userID: newUser.uuid },
                },
                jwtSecret, {
                    expiresIn: "24h",
                },
            );
            // Send token to client
            res.status(200).json({ token });
        });
    } catch (error) {
        logger.info('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Serve frontend
app.get('*', (req, res) => {
    res.status(404).send('Not found');
});

// Helper function to get user ID from socket
function getUserIDFromSocket(socket) {
    const token = socket.handshake.headers.authorization.split(' ')[1];
    const decodedToken = jwt.decode(token);
    return decodedToken.data.userID;
}

// Helper function to get username from socket
    function getUsernameFromSocket(socket) {
    const token = socket.handshake.headers.authorization.split(' ')[1];
    const decodedToken = jwt.decode(token);;
    return decodedToken.data.username;
}

// Socket.io handlers
io.on('connection', (socket) => {
    logger.info('Client connected');
    socket.on('loadCameras', async(callback) => {
        const userID = getUserIDFromSocket(socket);
        const cameras = await Camera.find({ userID });
        callback(cameras);
    });

    socket.on('addCamera', async({ name, rtspUrl }, callback) => {
        const userID = getUserIDFromSocket(socket);
        const camera = new Camera({ name, rtspUrl, userID });
        await camera.save();
        callback({ success: true, camera });
    });

    socket.on('deleteCamera', async({ cameraId }, callback) => {
        const userID = getUserIDFromSocket(socket);
        const camera = await Camera.findOneAndDelete({ _id: cameraId, userID });
        if (!camera) return callback({ error: 'Camera not found or not authorized' });
        callback({ success: true });
    });

socket.on('shareCamera', async ({ cameraId, username }, callback) => {
    try {
        // Extract the userID from the socket or a relevant method
        const userID = getUserIDFromSocket(socket);
        const sharingUser = getUsernameFromSocket(socket);
        // Validate if the camera exists and belongs to the current user
        const camera = await Camera.findOne({ _id: cameraId, userID });
        if (!camera) {
            return callback({ error: 'Camera not found or not authorized' });
        }

        // Find the user to share with
        const userToShareWith = await findUser(username);
        if (!userToShareWith) {
            return callback({ error: 'User to share with not found' });
        }

        // Create a shared camera entry for the target user
        const newCamera = new Camera({
            name: `${camera.name}-shared-by-${sharingUser}`,
            rtspUrl: camera.rtspUrl,
            userID: userToShareWith.uuid
        });

        await newCamera.save();

        callback({ success: true });
    } catch (error) {
        console.error('Error in shareCamera:', error);
        callback({ error: 'An unexpected error occurred' });
    }
});

socket.on('recordStream', async ({ cameraId, toggle }, callback) => {
    try {
        const camera = await Camera.findById(cameraId);
        if (!camera) return callback({ error: 'Camera not found' });

        // Encode camera name to ensure a safe directory name
        const safeCameraName = encodeURIComponent(camera.name);

        // Create the directory path
        const directoryPath = path.join(STREAM_VOLUME_PATH, safeCameraName, "recordings");
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        // Generate the file name with timestamp
        const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
        const filePath = path.join(directoryPath, `recording_${safeCameraName}_${timestamp}.mov`);

        if (toggle) {
            // Start the recording pipeline
            startRecordingPipeline(camera.rtspUrl, filePath);
            callback({ success: true, filePath });
        } else {
            // Stop the recording pipeline
            stopPipeline(camera.rtspUrl);
            callback({ success: true });
        }
    } catch (error) {
        console.error('Error in recordStream:', error);
        callback({ error: 'An error occurred while handling the request.' });
    }
});

    socket.on('startStream', async({ cameraId }, callback) => {
        const userID = getUserIDFromSocket(socket);
        const username = await getUsernameFromSocket(socket);
        const camera = await Camera.findOne({ _id: cameraId, userID });
        if (!camera) return callback({ error: 'Camera not found or not authorized' });

        const safeCameraName = encodeURIComponent(camera.name); // Encode camera name
        const streamPath = path.join(STREAM_VOLUME_PATH, safeCameraName);
        if (!fs.existsSync(streamPath)) {
            fs.mkdirSync(streamPath, { recursive: true });
        }

        startHLSPipeline(camera.rtspUrl, streamPath, safeCameraName); // Use encoded name for file paths

        const streamUrl = `${STREAM_BASE_URL}/streams/${safeCameraName}/output.m3u8`;
        logger.info(`HLS Stream URL: ${streamUrl}`);

        // Send link to frontend
        socket.emit('streamReady', { cameraId, streamUrl });
        callback({ success: true, streamUrl });
    });


    socket.on('stopStream', async({ cameraId }, callback) => {
        const userID = getUserIDFromSocket(socket);
        const camera = await Camera.findOne({ _id: cameraId, userID });
        if (!camera) return callback({ error: 'Camera not found or not authorized' });

        stopPipeline(camera.rtspUrl);
        callback({ success: true });
    });
});



server.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));