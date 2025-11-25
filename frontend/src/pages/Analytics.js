import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Analytics.css';

const Analytics = () => {
  const { user, token, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInstructor()) {
      fetchPendingCount();
    }
  }, []);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/assignment-submissions/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const submissions = await response.json();
        const pending = submissions.filter(sub => 
          sub.status === 'submitted' || sub.status === 'under_review'
        ).length;
        setPendingCount(pending);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending count:', error);
      setLoading(false);
    }
  };

  if (!isInstructor()) {
    return (
      <div className="analytics-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>This page is only available for instructors.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>Monitor course performance and student progress</p>
      </div>

      {/* Assignment Review Card */}
      <div className="analytics-card">
        <div className="card-header">
          <h3>Assignment Reviews</h3>
          <div className="pending-badge">{pendingCount} Pending</div>
        </div>
        
        <div className="card-content">
          <p>Review and grade student assignment submissions.</p>
          
          <div className="assignment-stats">
            <div className="stat-item">
              <span className="stat-number">{pendingCount}</span>
              <span className="stat-label">Pending Review</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/assignment-review')}
            className="btn-primary review-btn"
            disabled={pendingCount === 0}
          >
            {pendingCount > 0 ? (
              `Review Assignments (${pendingCount})`
            ) : (
              'No Assignments to Review'
            )}
          </button>
        </div>
      </div>

      {/* Other Analytics Cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Course Analytics</h3>
          <p>View course enrollment and completion rates</p>
          <button className="btn-outline">View Details</button>
        </div>

        <div className="analytics-card">
          <h3>Student Progress</h3>
          <p>Monitor student learning progress</p>
          <button className="btn-outline">View Details</button>
        </div>

        <div className="analytics-card">
          <h3>Exam Results</h3>
          <p>View exam performance analytics</p>
          <button className="btn-outline">View Details</button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;