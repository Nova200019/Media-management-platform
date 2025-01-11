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
const initializePassport = require('./passport-config');
const req = require('express/lib/request');
const flash = require('express-flash')
const session = require('express-session')
//Passport setup
initializePassport(passport,
     name =>  users.find (user => user.name === name),
     id => users.find (user => user.id === id)
    );

const app = express();

//App config
app.use(flash())
app.use(session({
    secret: 'Placeholder', //TODO read from env
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
//Allows req.body.ATTRIBUTE to be read out
app.use(express.urlencoded({extended: false}))


const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const io = socketIo(server, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
    }
});


app.set('view-engine', 'ejs')


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

const users = []

app.use('/', (req, res, next) => next())
//app.use(bodyParser.urlencoded()) 

app.use('/test', checkAuthenticated, (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    logger.info("HTest");
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        logger.info("Test1 / 2");
        return res.sendStatus(200);
    }

    return res.send("Test complete")
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
  })

app.post('/login', checkNotAuthenticated,passport.authenticate('local', {
    successRedirect: 'http://localhost',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {

    logger.info("Register page reached.");
    return res.render('register.ejs');
  });

  
  app.post('/register',checkNotAuthenticated, async (req, res) => {
    try {
      logger.info("Name: " + req.body.name)
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.name,
        password: hashedPassword
      })
      res.redirect('/login')
    } catch {
      res.redirect('/test')
    }
    logger.info(users)
  })

function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        logger.info('User successfully authenticated')
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        logger.info("User already logged in")
        return res.redirect('http://localhost')
    }
    next()
}




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

