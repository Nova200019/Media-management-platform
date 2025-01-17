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