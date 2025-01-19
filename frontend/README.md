# Media Management Platform Frontend

This frontend code is for a Media Management Platform that allows users to manage and stream video from multiple cameras. The application is built using React and integrates with a backend server via Socket.IO for real-time communication.

## Features

- **User Authentication**: Redirects unauthenticated users to the login page.
- **Camera Management**: Add, delete, and share cameras.
- **Live Streaming**: Start and stop live streams for each camera.
- **Recording**: Record live streams.
- **HLS Player**: Uses HLS.js to play video streams.

## Components

### `App.js`

- **State Management**: Uses React hooks (`useState`, `useEffect`, `useRef`, `useContext`) to manage state and side effects.
- **Socket.IO Integration**: Connects to the backend server using Socket.IO for real-time updates.
- **Authentication**: Checks if the user is authenticated and redirects to the login page if not.
- **Camera Operations**: Handles adding, deleting, sharing, starting, stopping, and recording camera streams.
- **HLS Player Setup**: Configures HLS.js to play video streams.

### `AddCameraForm.js`

- **Form Component**: Provides a form to add new cameras.

### `CameraConsole.js`

- **Camera Console**: Displays individual camera controls and video streams.

## How It Works

1. **Authentication**: On mount, the app checks if the user is authenticated. If not, it redirects to the login page.
2. **Socket Connection**: If authenticated, the app connects to the backend server using Socket.IO and loads existing cameras.
3. **Camera Management**: Users can add, delete, and share cameras using the provided form and buttons.
4. **Live Streaming**: Users can start and stop live streams for each camera. The app waits for the stream URL to become available before setting up the HLS player.
5. **Recording**: Users can toggle recording for each camera stream.
6. **HLS Player**: The app uses HLS.js to play video streams in supported browsers.

## Usage

1. **Start the App**: Run the app in development mode using `npm start`.
2. **Add Cameras**: Use the form to add new cameras.
3. **Manage Streams**: Start, stop, and record live streams using the provided buttons.
4. **Share Cameras**: Share cameras with other users by entering their username.

This frontend code provides a comprehensive interface for managing and streaming video from multiple cameras in a media management platform.