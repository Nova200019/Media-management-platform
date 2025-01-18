# Media-management-platform

## Running the Application

To run the application using Docker, follow these steps:

1. Ensure you have Docker installed on your machine. You can download it from [here](https://www.docker.com/products/docker-desktop).

2. Navigate to the project directory:
     ```
   cd /path/to/project-root
   ```
3. Start the application using Docker Compose:
 ```
 docker-compose up
 ```
4. Access the application in your browser by visiting:
  ```
  http://localhost
  ```

  ## Updating the Application

  After updating the frontend, follow these steps using Command Prompt to provide a new Build

  1. Navigate to the project directory
     ```
     cd /path/to/project-root
     ```
  2. Navigate to the frontend
       ```
      cd ./frontend
       ```
  3. Run the new build
       ```
      npm run build
      ```
  4. Remove the old build
        ```
      rmdir /s /q ..\backend\build
      ```
  5. Move the new build into the backend
     ```
      move build ..\backend
      ```

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