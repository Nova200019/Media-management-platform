import React from 'react';

const CameraConsole = ({ camera, onStart, onStop, onRecord, onDelete }) => (
    <div>
        <h3>{camera.name}</h3>
        <video id={`video-${camera._id}`} autoPlay></video>
        <button onClick={() => onStart(camera._id)}>Start Stream</button>
        <button onClick={() => onStop(camera._id)}>Stop Stream</button>
        <button onClick={() => onRecord(camera._id)}>Record Stream</button>
        <button onClick={() => onDelete(camera._id)}>Delete Camera</button>
    </div>
);

export default CameraConsole;
