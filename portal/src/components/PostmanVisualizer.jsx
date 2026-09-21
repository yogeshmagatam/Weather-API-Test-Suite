import React, { useState } from 'react';

export default function PostmanVisualizer() {
  const [activeFolder, setActiveFolder] = useState('01_Weather_API_Positive_Cases');
  const [isRunningNewman, setIsRunningNewman] = useState(false);
  const [newmanOutput, setNewmanOutput] = useState(null);

  const folders = [
    {
      id: '01_Weather_API_Positive_Cases',
      name: '01 Weather Positive Cases',
      count: '5 requests',
      requests: [
        { name: 'Get Current Weather (London - Metric Default)', method: 'GET', url: '{{baseUrl}}/api/v1/weather/current?city=London', asserts: ['Status code is 200 OK', 'Response time is under 300ms', 'Schema: Location & metric units'] },
        { name: 'Get Current Weather (New York - Imperial)', method: 'GET', url: '{{baseUrl}}/api/v1/weather/current?city=New York&units=imperial', asserts: ['Status code is 200 OK', 'Imperial units converted correctly (°F, mph)'] },
        { name: 'Get 5-Day Weather Forecast (Paris)', method: 'GET', url: '{{baseUrl}}/api/v1/weather/forecast?city=Paris&days=5', asserts: ['Status code is 200 OK', 'Forecast contains 5 chronological projections'] },
        { name: 'Get Active Weather Hazard Alerts', method: 'GET', url: '{{baseUrl}}/api/v1/weather/alerts', asserts: ['Status code is 200 OK', 'Returns active alert list with required fields'] },
        { name: 'Ingest Weather Observation (Authorized)', method: 'POST', url: '{{baseUrl}}/api/v1/weather/observations', asserts: ['Status code is 201 Created', 'Ingestion confirmed with new record_id'] }
      ]
    },
    {
      id: '02_Weather_API_Negative_Cases',
      name: '02 Weather Negative Cases',
      count: '4 requests',
      requests: [
        { name: 'Missing City Parameter (422)', method: 'GET', url: '{{baseUrl}}/api/v1/weather/current', asserts: ['Status code is 422 Unprocessable', 'RFC 7807 Error details array'] },
        { name: 'Non-Existent City (404)', method: 'GET', url: '{{baseUrl}}/api/v1/weather/current?city=AtlantisLostCity', asserts: ['Status code is 404 Not Found', 'Error indicates CITY_NOT_FOUND'] },
        { name: 'Observation Missing API Key (401)', method: 'POST', url: '{{baseUrl}}/api/v1/weather/observations', asserts: ['Status code is 401 Unauthorized', 'Error indicates UNAUTHORIZED'] },
        { name: 'SQL Injection Resilience (404 Sanitized)', method: 'GET', url: "{{baseUrl}}/api/v1/weather/current?city=' OR '1'='1", asserts: ['Status code is 404 (Sanitized parameterized lookup)', 'No SQL errors or 500 leakages'] }
      ]
    },
    {
      id: '03_Flight_Booking_Positive_Flow',
      name: '03 Flight Booking Flow',
      count: '4 requests',
      requests: [
        { name: 'Search Flights (LHR to JFK)', method: 'GET', url: '{{baseUrl}}/api/v1/flights/search?origin=LHR&destination=JFK', asserts: ['Status code is 200 OK', 'BA-178 available with seats > 0'] },
        { name: 'Create Flight Booking (Dynamic Chaining)', method: 'POST', url: '{{baseUrl}}/api/v1/bookings', asserts: ['Status code is 201 Created', 'Saves booking_ref regex BK-XXXXXX to environment'] },
        { name: 'Get Booking by Reference (Chained Variable)', method: 'GET', url: '{{baseUrl}}/api/v1/bookings/{{booking_ref}}', asserts: ['Status code is 200 OK', 'Retrieved booking matches chained reference'] },
        { name: 'Cancel Booking (Refund & Restores Inventory)', method: 'DELETE', url: '{{baseUrl}}/api/v1/bookings/{{booking_ref}}', asserts: ['Status code is 200 OK', 'Booking cancelled with refund amount', 'cancelled_at is recorded'] }
      ]
    },
    {
      id: '04_Flight_Booking_Negative_Cases',
      name: '04 Flight Negative Cases',
      count: '2 requests',
      requests: [
        { name: 'Duplicate Seat Collision (409 Conflict)', method: 'POST', url: '{{baseUrl}}/api/v1/bookings', asserts: ['Status code is 409 Conflict', 'Error indicates SEAT_ALREADY_RESERVED'] },
        { name: 'Search Identical Origin & Destination (400)', method: 'GET', url: '{{baseUrl}}/api/v1/flights/search?origin=LHR&destination=LHR', asserts: ['Status code is 400 Bad Request', 'Error indicates INVALID_ROUTE'] }
      ]
    },
    {
      id: '05_Weather_Flight_Integration',
      name: '05 Weather & Flight Integration',
      count: '2 requests',
      requests: [
        { name: 'Aviation Advisory - Tokyo Typhoon (GROUNDED)', method: 'GET', url: '{{baseUrl}}/api/v1/flights/7/weather-advisory', asserts: ['Status code is 200 OK', 'Advisory status is GROUNDED', 'Recommendation contains Visual approach suspended'] },
        { name: 'Aviation Advisory - New York JFK (CLEARED)', method: 'GET', url: '{{baseUrl}}/api/v1/flights/1/weather-advisory', asserts: ['Status code is 200 OK', 'Advisory status is CLEARED', 'Dispatch code DISPATCH-CLR-01'] }
      ]
    }
  ];

  const handleRunNewman = () => {
    setIsRunningNewman(true);
    setTimeout(() => {
      setNewmanOutput({
        totalIterations: 1,
        totalRequests: 17,
        totalPrerequest: 17,
        totalAssertions: 38,
        failedAssertions: 0,
        totalRunDuration: '1.42s',
        averageResponseTime: '34ms'
      });
      setIsRunningNewman(false);
    }, 1200);
  };

  const currentFolder = folders.find(f => f.id === activeFolder) || folders[0];

  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Postman Collection & Newman CI Automation</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Enterprise Postman test suite featuring dynamic variable chaining, pre-request scripts, Ajv JSON schema validation, and Newman headless execution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleRunNewman} disabled={isRunningNewman}>
            {isRunningNewman ? 'Running Newman...' : '⚡ Run Newman Collection'}
          </button>
        </div>
      </div>

      {/* Newman Terminal Report Simulation */}
      {newmanOutput && (
        <div className="glass-panel" style={{ padding: '20px', background: '#050914', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="live-dot" style={{ background: '#10b981' }}></span>
              <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                NEWMAN EXECUTION COMPLETE • 100% PASSED
              </span>
            </div>
            <button
              onClick={() => setNewmanOutput(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Requests</div>
              <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8' }}>{newmanOutput.totalRequests}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assertions</div>
              <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34d399' }}>{newmanOutput.totalAssertions}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Failures</div>
              <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>0</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Latency</div>
              <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{newmanOutput.averageResponseTime}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Run Time</div>
              <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{newmanOutput.totalRunDuration}</div>
            </div>
          </div>
        </div>
      )}

      {/* Folders & Request Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        
        {/* Folder List */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Collection Folders
          </div>
          {folders.map(f => {
            const isSelected = activeFolder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.35)' : 'transparent'}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    📁 {f.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {f.count}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>➔</span>
              </button>
            );
          })}

          {/* Newman CLI Command Box */}
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Headless CLI Run:
            </div>
            <div className="code-block" style={{ fontSize: '0.7rem', padding: '8px' }}>
              npx newman run postman/Weather_Flight_API_Test_Suite.postman_collection.json -e postman/Weather_API_Local.postman_environment.json
            </div>
          </div>
        </div>

        {/* Requests in Selected Folder */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              📁 {currentFolder.name}
            </h3>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              {currentFolder.requests.length} Test Endpoints
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentFolder.requests.map((req, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span className={`badge-method badge-${req.method.toLowerCase()}`}>
                    {req.method}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.name}</span>
                </div>

                <div className="mono" style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {req.url}
                </div>

                {/* Assertions */}
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Postman Tests / Assertions:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {req.asserts.map((a, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#34d399',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        ✔ {a}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
