import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import CameraStore from './components/CameraStore';
import EventLogs from './components/EventLogs';
import './FrontendUI.css';

const FrontendUI = ({
  handleLogout,
  cameras,
  onAddCamera,
  onDeleteCamera,
  onStartStream,
  onStopStream,
  onRecordStream,
}) => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    document.body.classList.toggle('dark-mode');
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const parallaxContainer = document.querySelector('.parallax-container');
    const parallaxLayers = document.querySelectorAll('.parallax-layer');

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      parallaxLayers.forEach((layer, index) => {
        const speed = (index + 1) / 100; // Adjust speed per layer
        const xOffset = (clientX - centerX) * speed;
        const yOffset = (clientY - centerY) * speed;

        layer.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      });
    };

    if (parallaxContainer) {
      parallaxContainer.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (parallaxContainer) {
        parallaxContainer.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            cameras={cameras}
            onDeleteCamera={onDeleteCamera}
            onStartStream={onStartStream}
            onStopStream={onStopStream}
            onRecordStream={onRecordStream}
          />
        );
      case 'camera-store':
        return <CameraStore onAddCamera={onAddCamera} />;
      case 'event-logs':
        return <EventLogs />;
      default:
        return (
          <Dashboard
            cameras={cameras}
            onDeleteCamera={onDeleteCamera}
            onStartStream={onStartStream}
            onStopStream={onStopStream}
            onRecordStream={onRecordStream}
          />
        );
    }
  };

  return (
    <div className="parallax-container">
      <div className="parallax-layer bg"></div>
      <div className="frontend-ui">
        <nav className="navbar">
          <ul>
            <li
              className={currentTab === 'dashboard' ? 'active-tab' : ''}
              onClick={() => setCurrentTab('dashboard')}
            >
              Dashboard
            </li>
            <li
              className={currentTab === 'camera-store' ? 'active-tab' : ''}
              onClick={() => setCurrentTab('camera-store')}
            >
              Camera Store
            </li>
            <li
              className={currentTab === 'event-logs' ? 'active-tab' : ''}
              onClick={() => setCurrentTab('event-logs')}
            >
              Event Logs
            </li>
          </ul>
          <button className="logout" onClick={handleLogout}>
            Logout
          </button>
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </nav>
        <main>{renderContent()}</main>
      </div>
    </div>
  );
};

export default FrontendUI;
