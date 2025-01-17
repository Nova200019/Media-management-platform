const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const logger = require('./logger');
const { startHLSPipeline, stopPipeline } = require('./cameraManager');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const passport = require('passport');
const passportJwt = require('passport-jwt')
const req = require('express/lib/request');
const flash = require('express-flash')
const session = require('express-session')
const jwt = require('jsonwebtoken')
const cors = require('cors');
const { log } = require('console');
const {jwtDecode}  = require ('jwt-decode');
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
  res.header('Access-Control-Allow-Origin', '*');  // Frontend origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');  // Allow Authorization header
  res.sendStatus(200);  // Respond with a 200 OK for OPTIONS requests
});


const server = http.createServer(app);
const PORT = process.env.PORT || 3000; //Changed port to 80
const io = socketIo(server, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
    }
});
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
      console.error('Error connecting to the MySQL database:', err);
      return;
  }
  console.log('Connected to the MySQL database.');

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
          console.error('Error creating users table:', err);
      } else {
          console.log('Users table created or already exists.');
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
  res.sendFile(join(__dirname, "../frontend/index.html"));  //I think it doesnt need this
});

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
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.json(results);
  });
});

app.get('/cameras', async (req, res) => {
  try {
    const cameras = await Camera.find();
    res.status(200).json(cameras);
  } catch (error) {
    console.error('Error fetching cameras:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function findUser(username) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
      if (err) {
        console.error('Error querying database:', err);
        return reject(err);
      }
      console.log('User query results:', results);
      resolve(results[0]);
    });
  });
}

// API route for user authentication
app.post("/login", async (req, res) => {
  const user = await findUser(req.body.username);
  if (!user) {
    console.log("wrong credentials 1");
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      console.log("authentication OK");
      const token = jwt.sign(
        {
          data: {username: user.username, userID: user.uuid},
        },
        jwtSecret,
        {
          expiresIn: "1h",
        },
      );
      
      res.status(200).json({ token });
    } else {
      console.log("wrong credentials 2");
      res.status(401).json({ message: 'Invalid credentials.' });
    }
  } catch (e) {
    console.log("wrong password?");
    res.status(401).json({ message: 'Invalid credentials.' });
  }
});

// API route for user registration
app.post('/register', async (req, res) => {
  try {
    logger.info('Secret: ' + jwtSecret);
    const existingUser = await findUser(req.body.username);
    if (existingUser) {
      console.log('User already exists');
      return res.status(409).json({ message: 'User already exists' }); // Conflict status code
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const uuid = uuidv4();
    const newUser = {
      username: req.body.username,
      password: hashedPassword,
      uuid: uuid
    };
    logger.info('New user:', newUser);
    //Insert user into database
    db.query('INSERT INTO users (uuid, username, password) VALUES (?, ?, ?)', [newUser.uuid, newUser.username, newUser.password], (err, results) => {
      if (err) {
        console.error('Error inserting user into database:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      // Generate JWT token
      const token = jwt.sign(
        {
          data: {username: newUser.username, userID: newUser.uuid},
        },
        jwtSecret,
        {
          expiresIn: "24h",
        },
      );
      // Send token to client
      logger.info(token);
      res.status(200).json({ token });
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Socket.io handlers
io.on('connection', (socket) => {
    logger.info('Client connected');

    socket.on('loadCameras', async (callback) => {
      const token = socket.handshake.headers.authorization.split(' ')[1];
      logger.info(token)
      const decodedToken = jwt.decode(token);
      const userID = decodedToken.data.userID;
      logger.info("on connection data: "+ decodedToken.data);
      logger.info("on connection uuid: "+ userID);
      const cameras = await Camera.find({ userID });
      logger.info("cameras: "+ cameras);
      callback(cameras);
  });

  socket.on('addCamera', async ({ name, rtspUrl }, callback) => {
    const token = socket.handshake.headers.authorization.split(' ')[1];
    const decodedToken = jwt.decode(token);
    const userID = decodedToken.data.userID;
    logger.info("addCamera UUID: " +userID);
    const camera = new Camera({ name, rtspUrl, userID: userID });
    await camera.save();
    callback({ success: true, camera });
});

socket.on('startStream', async ({ cameraId }, callback) => {
  const token = socket.handshake.headers.authorization.split(' ')[1];
  const decodedToken = jwt.decode(token);
      const userID = decodedToken.data.userID;
  logger.info("startStream UUID: " + userID);
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


    socket.on('stopStream', async ({ cameraId }, callback) => {
      const token = socket.handshake.headers.authorization.split(' ')[1];
      const decodedToken = jwt.decode(token);
      const userID = decodedToken.data.userID;

      const camera = await Camera.findOne({ _id: cameraId, userID });
      if (!camera) return callback({ error: 'Camera not found or not authorized' });

      stopPipeline(camera.rtspUrl);
      callback({ success: true });
  });
});



server.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));

