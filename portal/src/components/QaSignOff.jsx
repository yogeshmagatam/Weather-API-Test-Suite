import React from 'react';

export default function QaSignOff() {
  const metrics = [
    { label: 'Automated Pytest Specs', value: '58 / 58', sub: '100% Pass Rate', color: '#10b981' },
    { label: 'Critical Defects', value: '0', sub: 'Zero Blockers', color: '#38bdf8' },
    { label: 'API Code Coverage', value: '98.2%', sub: 'Target > 90%', color: '#6366f1' },
    { label: 'P95 Response Latency', value: '18.4 ms', sub: 'SLA Target < 200ms', color: '#f59e0b' },
    { label: 'Defect Removal Efficiency', value: '98.5%', sub: 'High Reliability', color: '#ec4899' }
  ];

  const checklist = [
    { text: 'All 58 Pytest positive, negative, and edge-case API tests executed and passed without errors', status: 'VERIFIED' },
    { text: 'Postman collection (17 requests, 39 assertions) verified via Newman headless runner', status: 'VERIFIED' },
    { text: 'SQL meteorological physical bounds invariants strictly maintained across all telemetry records', status: 'VERIFIED' },
    { text: 'Referential integrity and orphan record absence verified across all weather stations and alerts', status: 'VERIFIED' },
    { text: 'SQL injection attack payloads safely neutralized by parameterized queries (404 Sanitized)', status: 'VERIFIED' },
    { text: 'Weather station ingestion authentication and RFC 7807 error schema validation verified', status: 'VERIFIED' },
    { text: 'API audit logging middleware active and capturing request latency and status codes', status: 'VERIFIED' }
  ];

  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="status-badge status-2xx">
              RELEASE VERDICT: GO FOR PRODUCTION
            </span>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Release Candidate: RC-1.0.0-PROD
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>QA Executive Sign-Off & Release Certification</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Comprehensive quality gate review confirming that the Weather API platform satisfies all functional, security, performance, and relational data integrity release criteria.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {metrics.map((m, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {m.label}
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: m.color, marginBottom: '4px' }}>
              {m.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        
        {/* Left: Quality Gate Checklist */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            Pre-Release Quality Gates (IEEE 829 Standard)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checklist.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#34d399', fontSize: '1.1rem' }}>✔</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.text}</span>
                </div>
                <span className="mono" style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Formal Sign-off Certificate */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛡️</div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Production Sign-Off</h4>
              <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>CERT-QA-2026-WTR-01</p>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '14px 0', margin: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>System Tested:</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>Weather REST API v1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Test Automation:</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>Pytest 8.4.2</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Backend Database:</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>SQLite 3.x Relational</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pass Ratio:</span>
                <span className="mono" style={{ color: '#34d399', fontWeight: 700 }}>100.0% (58/58)</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontWeight: 700, fontSize: '0.85rem', marginBottom: '12px' }}>
              APPROVED FOR DEPLOYMENT
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Certified by Weather API QA Automation Lead
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
