import React from 'react';

export default function Navbar({ activeTab, setActiveTab, isBackendLive }) {
  const tabs = [
    { id: 'explorer', label: 'API Explorer', icon: '🚀' },
    { id: 'matrix', label: 'Pytest Test Matrix', icon: '🧪' },
    { id: 'postman', label: 'Postman Runner', icon: '📬' },
    { id: 'sql', label: 'SQL Validator', icon: '💾' },
    { id: 'signoff', label: 'QA Sign-Off', icon: '📊' }
  ];

  return (
    <header className="glass-panel" style={{ margin: '16px 24px', padding: '14px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)'
          }}>
            ✈
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SkyPulse QA
              </h1>
              <span className="mono" style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                v1.0.0
              </span>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Weather & Flight-Booking REST API Automation Suite
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '5px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: isActive ? 'var(--primary-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 2px 10px rgba(56, 189, 248, 0.3)' : 'none'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '999px',
            background: isBackendLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)',
            border: `1px solid ${isBackendLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <span className="live-dot" style={{ background: isBackendLive ? '#10b981' : '#38bdf8', boxShadow: isBackendLive ? '0 0 8px #10b981' : '0 0 8px #38bdf8' }}></span>
            <span style={{ color: isBackendLive ? '#34d399' : '#38bdf8' }}>
              {isBackendLive ? 'LIVE FASTAPI BACKEND' : 'SIMULATED QA ENGINE'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
