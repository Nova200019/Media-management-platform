# Requirements

This document specifies the functional, non-functional and technical requirements for the Media Management Platform. This document is written with the thought of views being implemented. Should this not be the case, requirements written in **bold letters** will no longer be required.

# Functional Requirements

## Dashboard

- Dashboard with list of all cameras
- **Default view**
- Description of cameras (Name, Type, Status, Recording duration)
- **Create and select different views**
- **Add/Delete cameras to/from view**
- Add/Delete cameras to/from system
- Event Log
- Share cameras with other users


## IP Cameras

- Start/Stop cameras
- See, play, download, delete footage of camera from storage (Database)
- Live Video streaming at up to 1080p/60fps, storage at 1FPS
- Encoder Selection
- Playback controls fast forward, rewind, 
- Change camera configuration

## Authentication

- User Login/Authentication

# Non-functional Requirements

## Documentation

- Extensive documentation
- User Guide

## Performance

  - **View should support multiple cameras streaming simultaneously without significant performance decrease**
- System should support multiple cameras
- Camera limit depends on hardware

## Other
- Must be able to handle hardware errors
- User Interface should be intuitive
- System should log all user actions, camera errors, and system events

# Technical Requirements

## Technology stack
- Backend: JavaScript, NodeJS
- Frontend: React
- Database user: MongoDB
- Database cameras: MongoDB

## APIs
- API to access and change camera configuration
- API to Render video
- API for encoding, wrapping, packeting, transmission
- API to read camera data
## Operating environment
- Containerised environment of system, load balancing, scaling and orchestrating
- Load balancing to avoid degradation in performance
- Integration of cameras for centralisation
- Seamless integration between components including data serialisation, deserialisation
- Database for camera configuration, user data & recordings