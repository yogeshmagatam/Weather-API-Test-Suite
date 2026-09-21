import React, { useState } from 'react';
import { TEST_CASES_DATA } from '../data/mockApiData';

export default function TestMatrix() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalTest, setActiveModalTest] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const categories = ['All', 'Weather Positive', 'Weather Negative', 'Flight Positive', 'Flight Negative', 'SQL Invariants', 'Performance SLA'];

  const filteredTests = TEST_CASES_DATA.filter(tc => {
    const matchesCat = selectedCategory === 'All' || tc.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tc.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Controls */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Pytest Automated Test Matrix</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Complete portfolio of 59 automated test specifications covering unit, integration, edge-case validation, and SQL invariants.
          </p>
        </div>

        {/* Search input */}
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search by ID, name, or endpoint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {categories.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                background: isActive ? 'rgba(56, 189, 248, 0.18)' : 'rgba(17, 24, 39, 0.6)',
                borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Test Cases Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Test ID</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Category</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Test Specification & Target</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Endpoint / Operation</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Expected</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Result</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((tc, idx) => (
                <tr
                  key={tc.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                  }}
                >
                  <td className="mono" style={{ padding: '12px 18px', color: 'var(--primary)', fontWeight: 600 }}>
                    {tc.id}
                  </td>
                  <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontSize: '0.725rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)' }}>
                      {tc.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {tc.name}
                  </td>
                  <td className="mono" style={{ padding: '12px 18px', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                    {tc.endpoint}
                  </td>
                  <td className="mono" style={{ padding: '12px 18px' }}>
                    <span className="status-badge status-2xx" style={{ fontSize: '0.7rem' }}>
                      {tc.expectedCode}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 600, fontSize: '0.75rem' }}>
                      ✔ {tc.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setActiveModalTest(tc)}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      View Spec
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Specification Modal */}
      {activeModalTest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '24px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="mono" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    {activeModalTest.id}
                  </span>
                  <span className="status-badge status-2xx">
                    ✔ {activeModalTest.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeModalTest.name}</h3>
              </div>
              <button
                onClick={() => setActiveModalTest(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Content Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.875rem' }}>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Test Objective:
                </strong>
                <p style={{ color: 'var(--text-primary)' }}>{activeModalTest.objective}</p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Preconditions:
                </strong>
                <p style={{ color: 'var(--text-secondary)' }}>{activeModalTest.preconditions}</p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Step-by-Step Execution:
                </strong>
                <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                  {activeModalTest.steps.map((s, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
                  ))}
                </ol>
              </div>

              {/* Pytest Code Snippet */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Pytest Automation Implementation:
                  </strong>
                  <button
                    onClick={() => handleCopyCode(activeModalTest.pytestCode)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    {copiedCode ? '✔ Copied' : '📋 Copy Code'}
                  </button>
                </div>
                <div className="code-block">
                  <pre style={{ margin: 0 }}>{activeModalTest.pytestCode}</pre>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
