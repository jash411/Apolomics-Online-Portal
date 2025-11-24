import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const PlaceholderPage = () => {
  const location = useLocation();
  
  // Extract the page name from the URL
  const getPageTitle = () => {
    const path = location.pathname.substring(1); // Remove the leading slash
    return path.split('/').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const pageTitle = getPageTitle();

  return (
    <div className="container" style={{ marginTop: '100px', minHeight: '60vh' }}>
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🚧</div>
        <h1 style={{ color: 'var(--text-dark)', marginBottom: '1rem' }}>
          {pageTitle} Page
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '2rem' }}>
          This page is currently under development. We're working hard to bring you this content soon!
        </p>
        <div style={{ 
          background: 'var(--card-bg)', 
          padding: '2rem', 
          borderRadius: 'var(--border-radius)',
          border: '2px dashed rgba(102, 126, 234, 0.3)'
        }}>
          <h3 style={{ color: 'var(--text-dark)', marginBottom: '1rem' }}>
            Coming Soon Features:
          </h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            textAlign: 'left'
          }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#667eea' }}>✓</span> Detailed course information
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#667eea' }}>✓</span> Faculty profiles and expertise
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#667eea' }}>✓</span> Program requirements
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#667eea' }}>✓</span> Enrollment process
            </li>
          </ul>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            ← Back to Home
          </Link>
          <Link to="/courses" className="btn btn-outline">
            Browse Available Courses
          </Link>
        </div>
      </div>
    </div>
  );
};

// Make sure this export is present
export default PlaceholderPage;