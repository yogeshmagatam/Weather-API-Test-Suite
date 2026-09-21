import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ApiExplorer from './components/ApiExplorer';
import TestMatrix from './components/TestMatrix';
import PostmanVisualizer from './components/PostmanVisualizer';
import SqlValidator from './components/SqlValidator';
import QaSignOff from './components/QaSignOff';

export default function App() {
  const [activeTab, setActiveTab] = useState('explorer');
  const [isBackendLive, setIsBackendLive] = useState(false);

  useEffect(() => {
    // Check if local FastAPI server is reachable
    fetch('http://127.0.0.1:8000/health')
      .then(res => {
        if (res.ok) setIsBackendLive(true);
      })
      .catch(() => {
        setIsBackendLive(false);
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendLive={isBackendLive}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'explorer' && <ApiExplorer />}
        {activeTab === 'matrix' && <TestMatrix />}
        {activeTab === 'postman' && <PostmanVisualizer />}
        {activeTab === 'sql' && <SqlValidator />}
        {activeTab === 'signoff' && <QaSignOff />}
      </main>

      <footer style={{ padding: '20px 24px', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        <p>
          WeatherPulse Weather REST API Test Automation Suite • Built with Python, Pytest, Requests, Postman, SQLite, and React.
        </p>
      </footer>
    </div>
  );
}
