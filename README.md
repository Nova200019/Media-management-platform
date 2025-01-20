# Media Management Platform

This project is a Media Management Platform that allows users to manage and stream video from multiple cameras. The application consists of a frontend built with React and a backend built with Node.js, Express, and Socket.IO. The backend integrates with MongoDB and MySQL for data storage.

## Features

- **User Authentication**: Redirects unauthenticated users to the login page.
- **Camera Management**: Add, delete, and share cameras.
- **Live Streaming**: Start and stop live streams for each camera.
- **Recording**: Record live streams.
- **HLS Player**: Uses HLS.js to play video streams.

## Components

### Frontend

- **State Management**: Uses React hooks (`useState`, `useEffect`, `useRef`, `useContext`) to manage state and side effects.
- **Socket.IO Integration**: Connects to the backend server using Socket.IO for real-time updates.
- **Authentication**: Checks if the user is authenticated and redirects to the login page if not.
- **Camera Operations**: Handles adding, deleting, sharing, starting, stopping, and recording camera streams.
- **HLS Player Setup**: Configures HLS.js to play video streams.

### Backend

- **Express Server**: Sets up an Express server to handle HTTP requests.
- **Socket.IO Integration**: Integrates Socket.IO for real-time communication with the frontend.
- **MongoDB Connection**: Connects to MongoDB to store camera data.
- **MySQL Connection**: Connects to MySQL to store user data.
- **User Authentication**: Uses Passport.js with JWT strategy for user authentication.
- **Camera Operations**: Handles adding, deleting, sharing, starting, stopping, and recording camera streams.
- **HLS Streaming**: Uses HLS to stream video from cameras.

## How It Works

1. **Authentication**: On mount, the app checks if the user is authenticated. If not, it redirects to the login page.
2. **Socket Connection**: If authenticated, the app connects to the backend server using Socket.IO and loads existing cameras.
3. **Camera Management**: Users can add, delete, and share cameras using the provided form and buttons.
4. **Live Streaming**: Users can start and stop live streams for each camera. The app waits for the stream URL to become available before setting up the HLS player.
5. **Recording**: Users can toggle recording for each camera stream.
6. **HLS Player**: The app uses HLS.js to play video streams in supported browsers.

## Docker Setup Guide

To set up the Media Management Platform using Docker, follow these steps:

1. **Clone the Repository**:
    ```sh
    git clone https://github.com/your-repo/media-management-platform.git
    cd media-management-platform
    ```

2. **Build the Docker Images**:
    ```sh
    docker-compose build
    ```

3. **Start the Containers**:
    ```sh
    docker-compose up
    ```

4. **Access the Application**:
    - Frontend: Open your browser and navigate to `http://localhost:80`
    - Backend: The backend server will be running on `http://localhost:3000`

## Manual Setup Guide

1. **Install Dependencies**:
    ```sh
    npm install
    ```

2. **Build the Frontend**:
    ```sh
    npm run build
    ```

3. **Move the Build to the Backend**:
    ```sh
    move build ..\backend
    ```

4. **Start the Backend Server**:
    ```sh
    cd backend
    npm start
    ```

5. **Access the Application**:
    - Frontend: Open your browser and navigate to `http://localhost`
    - Backend: The backend server will be running on `http://localhost:3000`
    - Or you can change them using environment variables used in compose

This setup guide provides instructions for setting up the Media Management Platform using Docker and accessing the frontend via `http://localhost`.