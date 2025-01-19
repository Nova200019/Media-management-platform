# Media Management Platform Backend

This backend code is for a Media Management Platform that allows users to manage and stream video from multiple cameras. The backend is built using Node.js, Express, and Socket.IO, and it integrates with MongoDB and MySQL for data storage.

## Features

- **User Authentication**: Uses JWT for secure authentication.
- **Camera Management**: Add, delete, and share cameras.
- **Live Streaming**: Start and stop live streams for each camera using HLS.
- **Recording**: Record live streams.
- **Database Integration**: Uses MongoDB for camera data and MySQL for user data.

## Components

### `server.js`

- **Express Server**: Sets up an Express server to handle HTTP requests.
- **Socket.IO Integration**: Integrates Socket.IO for real-time communication with the frontend.
- **MongoDB Connection**: Connects to MongoDB to store camera data.
- **MySQL Connection**: Connects to MySQL to store user data.
- **User Authentication**: Uses Passport.js with JWT strategy for user authentication.
- **Camera Operations**: Handles adding, deleting, sharing, starting, stopping, and recording camera streams.
- **HLS Streaming**: Uses HLS to stream video from cameras.

## How It Works

1. **User Authentication**: Users can register and log in. JWT tokens are used for authentication.
2. **Socket Connection**: The server uses Socket.IO to handle real-time communication with the frontend.
3. **Camera Management**: Users can add, delete, and share cameras. Camera data is stored in MongoDB.
4. **Live Streaming**: Users can start and stop live streams for each camera. The server uses HLS to stream video.
5. **Recording**: Users can toggle recording for each camera stream. Recordings are saved to the file system.
6. **Database Integration**: The server uses MongoDB to store camera data and MySQL to store user data.

## API Endpoints

- **`POST /login`**: Authenticates a user and returns a JWT token.
- **`POST /register`**: Registers a new user and returns a JWT token.
- **`GET /self`**: Verifies the JWT token and returns the authenticated user's data.
- **`GET /cameras`**: Returns a list of cameras for the authenticated user.
- **`POST /addCamera`**: Adds a new camera for the authenticated user.
- **`POST /deleteCamera`**: Deletes a camera for the authenticated user.
- **`POST /shareCamera`**: Shares a camera with another user.
- **`POST /startStream`**: Starts a live stream for a camera.
- **`POST /stopStream`**: Stops a live stream for a camera.
- **`POST /recordStream`**: Toggles recording for a camera stream.

# API Documentation

     ## Endpoints

      ### `GET /`

      Serves the frontend application.

      ### `GET /login`

      Serves the login page of the frontend application.

      ### `GET /register`

      Serves the registration page of the frontend application.

      ### `GET /self`

      Verifies the JWT token and returns the authenticated user's information.

      - **Headers:**
         - `Authorization: Bearer <token>`
      - **Responses:**
         - `200 OK`: Returns the authenticated user's information.
         - `401 Unauthorized`: If the token is invalid or missing.

      ### `GET /users`

      Fetches all users from the MySQL database. (For testing purposes)

      - **Responses:**
         - `200 OK`: Returns a list of users.
         - `500 Internal Server Error`: If there is an error querying the database.

      ### `GET /cameras`

      Fetches all cameras from the MongoDB database.

      - **Responses:**
         - `200 OK`: Returns a list of cameras.
         - `500 Internal Server Error`: If there is an error fetching cameras.

      ### `POST /login`

      Authenticates a user and returns a JWT token.

      - **Request Body:**
         - `username`: The username of the user.
         - `password`: The password of the user.
      - **Responses:**
         - `200 OK`: Returns a JWT token.
         - `401 Unauthorized`: If the credentials are invalid.

      ### `POST /register`

      Registers a new user and returns a JWT token.

      - **Request Body:**
         - `username`: The username of the user.
         - `password`: The password of the user.
      - **Responses:**
         - `200 OK`: Returns a JWT token.
         - `409 Conflict`: If the user already exists.
         - `500 Internal Server Error`: If there is an error during registration.

      ### `GET /streams`

      Serves HLS streams with CORS headers.

      - **Responses:**
         - `200 OK`: Returns the requested stream.
         - `404 Not Found`: If the stream is not found.

      ### `GET *`

      Serves a 404 Not Found page for any unspecified routes.

      - **Responses:**
         - `404 Not Found`: If the route is not found.

      ## Socket.io Events

      ### `connection`

      Handles a new client connection.

      ### `loadCameras`

      Loads cameras for the authenticated user.

      - **Callback:**
         - `cameras`: A list of cameras for the authenticated user.

      ### `addCamera`

      Adds a new camera for the authenticated user.

      - **Parameters:**
         - `name`: The name of the camera.
         - `rtspUrl`: The RTSP URL of the camera.
      - **Callback:**
         - `success`: Indicates if the camera was added successfully.
         - `camera`: The added camera.

      ### `startStream`

      Starts streaming for a specified camera.

      - **Parameters:**
         - `cameraId`: The ID of the camera to start streaming.
      - **Callback:**
         - `success`: Indicates if the stream was started successfully.
         - `streamUrl`: The URL of the HLS stream.
         - `error`: If the camera is not found or not authorized.

      ### `stopStream`

      Stops streaming for a specified camera.

      - **Parameters:**
         - `cameraId`: The ID of the camera to stop streaming.
      - **Callback:**
         - `success`: Indicates if the stream was stopped successfully.
         - `error`: If the camera is not found or not authorized.

## Usage

1. **Start the Server**: Run the server using `node server.js`.
2. **User Registration**: Register a new user using the `/register` endpoint.
3. **User Login**: Log in using the `/login` endpoint to receive a JWT token.
4. **Manage Cameras**: Use the provided endpoints to add, delete, and share cameras.
5. **Stream and Record**: Start, stop, and record live streams using the provided endpoints.

This backend code provides a comprehensive API for managing and streaming video from multiple cameras in a media management platform.