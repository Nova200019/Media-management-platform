import React, { useState } from 'react';
import './CameraStore.css';

const CameraStore = ({ onAddCamera }) => {
  const [name, setName] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name, rtspUrl }; // Ensure this matches backend expectations
    console.log('Submitting camera:', payload); // Debug payload
    onAddCamera(payload); // Pass payload to App.js
    setName('');
    setRtspUrl('');
};

  return (
    <div className="camera-store">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Camera Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="RTSP URL"
          value={rtspUrl}
          onChange={(e) => setRtspUrl(e.target.value)}
          required
        />
        <button type="submit">Add Camera</button>
      </form>
    </div>
  );
};

export default CameraStore;
