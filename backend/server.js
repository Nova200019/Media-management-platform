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

const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

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


// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/mediasoup';
mongoose.connect(mongoUri);
const CameraSchema = new mongoose.Schema({ name: String, rtspUrl: String });
const Camera = mongoose.model('Camera', CameraSchema);

const STREAM_VOLUME_PATH = process.env.STREAM_VOLUME_PATH || '/video-storage';
const STREAM_BASE_URL = process.env.STREAM_BASE_URL || 'http://localhost:3000';


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

//TEST FOR NEW STUFF
//
//
//

const jwtSecret = "Mys3cr3t";
const users = []

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

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
  res.json(users)
})


app.post("/login", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  logger.info(res.header)
  const user = users.find(user => user.username === req.body.username)
  console.log("Username 1 " +req.body.username)
  console.log("User: " + user)
  if (user == null) {
    console.log("wrong credentials 1");
    return res.status(401).end();
}
try {
  if (await bcrypt.compare(req.body.password, user.password)) {
    console.log("authentication OK");
    const token = jwt.sign(
      {
        data: user,
      },
      jwtSecret,
      {
        issuer: "accounts.examplesoft.com",
        audience: "yoursite.net",
        expiresIn: "1h",
      },
    );
    
    res.json({ token });
  } else {
    console.log("wrong credentials 2");
    res.status(401).end();
  }
} catch (e) {
  console.log("wrong password?");
    res.status(401).end();
}
});

app.post('/register', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  try {
    console.log("Name: " + req.body.username)
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      username: req.body.username,
      password: hashedPassword
    })
    res.status(200).end();
  } catch {
    res.status(401).end();
  }
  res.end();
})

const jwtDecodeOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
  issuer: "accounts.examplesoft.com",
  audience: "yoursite.net",
};

passport.use(
  new JwtStrategy(jwtDecodeOptions, (payload, done) => {
    return done(null, payload.data);
  }),
);

//
// Old stuff
// 

// Socket.io handlers
io.on('connection', (socket) => {
    logger.info('Client connected');

    socket.on('loadCameras', async(callback) => {
        const cameras = await Camera.find();
        callback(cameras);
    });

    socket.on('addCamera', async({ name, rtspUrl }, callback) => {
        const camera = new Camera({ name, rtspUrl });
        await camera.save();
        callback({ success: true, camera });
    });

    socket.on('startStream', async({ cameraId }, callback) => {
        const camera = await Camera.findById(cameraId);
        if (!camera) return callback({ error: 'Camera not found' });

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
        const camera = await Camera.findById(cameraId);
        if (!camera) return callback({ error: 'Camera not found' });

        stopPipeline(camera.rtspUrl);
        callback({ success: true });
    });
});



server.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));

