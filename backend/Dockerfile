# Use the official Node.js image
FROM node:18

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Install dependencies
RUN npm install


RUN apt-get update && apt-get install -y \
    gstreamer1.0-tools \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-alsa \
    gstreamer1.0-plugins-base-apps \
    && rm -rf /var/lib/apt/lists/*
    
# Copy the rest of the application code
COPY . .

# Copy the built React app from the frontend build directory into the container
COPY ./build ./frontend/build

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["node", "server.js"]