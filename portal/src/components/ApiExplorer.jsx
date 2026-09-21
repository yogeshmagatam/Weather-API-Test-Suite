import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, executeApiCall } from '../data/mockApiData';

export default function ApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [params, setParams] = useState({ city: 'London', units: 'metric' });
  const [headers, setHeaders] = useState({ 'X-API-Key': 'test_api_key_secure_123' });
  const [body, setBody] = useState('');
  const [activePreset, setActivePreset] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Initialize parameters when endpoint changes
  useEffect(() => {
    const initialParams = {};
    if (selectedEndpoint.params) {
      selectedEndpoint.params.forEach(p => {
        initialParams[p.key] = p.value;
      });
    }
    setParams(initialParams);
    setHeaders(selectedEndpoint.headers || {});
    setBody(selectedEndpoint.body || '');
    setActivePreset(0);
    setResponse(null);
  }, [selectedEndpoint]);

  // Apply a preset
  const handleApplyPreset = (preset, idx) => {
    setActivePreset(idx);
    if (preset.params) setParams({ ...preset.params });
    if (preset.headers) setHeaders({ ...preset.headers });
    if (preset.body) setBody(preset.body);
  };

  const handleExecute = async () => {
    setIsLoading(true);
    const customPath = selectedEndpoint.presets[activePreset]?.customPath || selectedEndpoint.path;
    const res = await executeApiCall(selectedEndpoint.method, customPath, params, headers, body);
    setResponse(res);
    setIsLoading(false);
  };

  // Generate cURL string
  const generateCurl = () => {
    const customPath = selectedEndpoint.presets[activePreset]?.customPath || selectedEndpoint.path;
    const validParams = Object.entries(params).filter(([_, v]) => v !== undefined && v !== "");
    const queryString = validParams.length > 0 ? "?" + new URLSearchParams(validParams).toString() : "";
    const url = `http://127.0.0.1:8000${customPath}${queryString}`;

    let curl = `curl -X ${selectedEndpoint.method} "${url}"`;
    Object.entries(headers).forEach(([k, v]) => {
      curl += ` \\\n  -H "${k}: ${v}"`;
    });
    if (body && (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PATCH')) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${body.replace(/\n/g, '')}'`;
    }
    return curl;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner / Explanation */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Interactive REST API Console</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Execute live endpoints, test validation boundaries, evaluate aviation hazard clearance, and inspect HTTP response payloads.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleCopyCurl} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            {copiedCurl ? '✔ Copied cURL' : '📋 Copy cURL'}
          </button>
          <button className="btn btn-primary" onClick={handleExecute} disabled={isLoading} style={{ minWidth: '130px' }}>
            {isLoading ? 'Executing...' : '▶ Send Request'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        
        {/* Left Column: Endpoint Navigation */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '720px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            API Endpoints Catalog
          </div>
          {API_ENDPOINTS.map(ep => {
            const isSelected = selectedEndpoint.id === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => setSelectedEndpoint(ep)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.3)' : 'transparent'}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className={`badge-method badge-${ep.method.toLowerCase()}`}>
                  {ep.method}
                </span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {ep.name}
                  </div>
                  <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {ep.path}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Request Builder & Response Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Request Config Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            
            {/* Header / Path Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className={`badge-method badge-${selectedEndpoint.method.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '4px 10px' }}>
                {selectedEndpoint.method}
              </span>
              <span className="mono" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedEndpoint.path}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {selectedEndpoint.description}
            </p>

            {/* Test Scenarios / Presets */}
            {selectedEndpoint.presets && selectedEndpoint.presets.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  One-Click Test Scenarios:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedEndpoint.presets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyPreset(preset, idx)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid',
                        background: activePreset === idx ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        borderColor: activePreset === idx ? 'var(--primary)' : 'var(--border-color)',
                        color: activePreset === idx ? '#38bdf8' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Parameters Grid */}
            {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Query Parameters
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {selectedEndpoint.params.map(p => (
                    <div key={p.key}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span className="mono" style={{ color: 'var(--primary)' }}>{p.key}</span>
                        {p.required && <span style={{ color: 'var(--accent-rose)' }}> *</span>}
                      </label>
                      <input
                        type="text"
                        className="form-input mono"
                        value={params[p.key] || ''}
                        onChange={(e) => setParams({ ...params, [p.key]: e.target.value })}
                        placeholder={p.description}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body Editor if POST/PATCH */}
            {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PATCH') && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  JSON Request Body
                </div>
                <textarea
                  className="form-textarea mono"
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  style={{ fontSize: '0.8rem', lineHeight: '1.4' }}
                />
              </div>
            )}

          </div>

          {/* Response Inspector Card */}
          {response && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`status-badge ${response.status >= 200 && response.status < 300 ? 'status-2xx' : 'status-4xx'}`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ⏱ {response.durationMs} ms
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                    {response.source}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {response.url}
                </div>
              </div>

              {/* JSON Viewer */}
              <div className="code-block" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
