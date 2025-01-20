import React from 'react';
import './Dashboard.css';

const Dashboard = ({ cameras = [], onStartStream, onDeleteCamera }) => {
  return (
    <div className="dashboard">
      <div className="camera-grid">
        {cameras.length > 0 ? (
          cameras.map((camera) => (
            <div key={camera._id} className="camera-card">
              <h3>{camera.name}</h3>
              <video id={`video-${camera._id}`} autoPlay controls></video>
              <div className="actions">
                <button onClick={() => onStartStream(camera._id)}>Start Stream</button>
                <button onClick={() => onDeleteCamera(camera._id)}>Delete Camera</button>
              </div>
            </div>
          ))
        ) : (
          <p>No cameras available.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
