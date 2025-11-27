import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AssignmentReview.css';

const AssignmentReview = () => {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [reviewData, setReviewData] = useState({
    score: '',
    feedback: '',
    status: 'approved'
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/assignment-submissions/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 ALL submissions:', data);
        
        // Filter only pending submissions
        const pendingSubmissions = data.filter(sub => 
          sub.status === 'submitted' || sub.status === 'under_review'
        );
        console.log('✅ Pending submissions:', pendingSubmissions);
        
        setSubmissions(pendingSubmissions);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setLoading(false);
    }
  };

const handleReview = async (submissionId) => {
  try {
    console.log('🎯 Reviewing submission:', submissionId, 'with data:', reviewData);
    
    // Use POST method for the custom review action
    const response = await fetch(`http://localhost:8000/api/assignment-submissions/${submissionId}/review/`, {
      method: 'POST', // Use POST instead of PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify(reviewData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Review successful:', result);
      alert('Assignment reviewed successfully!');
      setReviewing(null);
      setReviewData({ score: '', feedback: '', status: 'approved' });
      fetchSubmissions();
    } else {
      const errorData = await response.json();
      console.error('❌ Review failed:', errorData);
      alert('Error reviewing assignment: ' + JSON.stringify(errorData));
    }
  } catch (error) {
    console.error('❌ Error reviewing assignment:', error);
    alert('Error reviewing assignment: ' + error.message);
  }
};
  

  if (loading) {
    return <div className="loading">Loading submissions...</div>;
  }

  console.log('🎨 Rendering submissions:', submissions);

  return (
    <div className="assignment-review-container">
      <h1>Assignment Submissions for Review</h1>
      
      {submissions.length === 0 ? (
        <div className="no-submissions">
          <p>No assignments pending review</p>
          <p><small>But the API says there are submissions. Check the console for details.</small></p>
        </div>
      ) : (
        <div className="submissions-list">
          <div className="submission-count">
            Found {submissions.length} submission(s) pending review
          </div>
          
          {submissions.map((submission, index) => (
            <div key={submission.id} className="submission-card">
              <div className="submission-header">
                <h3>
                  Submission #{index + 1} 
                  <span className="submission-id">(ID: {submission.id})</span>
                </h3>
                <div className="student-info">
                  <span className="student-name">
                    Student: {submission.student_name || submission.student?.username || 'Unknown'}
                  </span>
                  <span className="submission-status status-badge">
                    Status: {submission.status}
                  </span>
                </div>
              </div>
              
              <div className="submission-content">
                {submission.submission_text && (
                  <div className="submission-text">
                    <h4>📝 Student's Answer:</h4>
                    <div className="text-content">
                      {submission.submission_text}
                    </div>
                  </div>
                )}
                
                {!submission.submission_text && (
                  <div className="no-text">
                    <p>📄 No text submission (file upload only)</p>
                  </div>
                )}
                
                <div className="submission-meta">
                  <span>📅 Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                  <span>📚 Assignment: {submission.assignment_title || 'Unknown Assignment'}</span>
                </div>
              </div>

              {reviewing === submission.id ? (
                <div className="review-form">
                  <h4>✏️ Review This Assignment</h4>
                  
                  <div className="form-group">
                    <label>Score (0-100)</label>
                    <input
                      type="number"
                      value={reviewData.score}
                      onChange={(e) => setReviewData({...reviewData, score: e.target.value})}
                      min="0"
                      max="100"
                      required
                      placeholder="Enter score 0-100"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Feedback to Student</label>
                    <textarea
                      value={reviewData.feedback}
                      onChange={(e) => setReviewData({...reviewData, feedback: e.target.value})}
                      rows="4"
                      placeholder="Provide constructive feedback..."
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={reviewData.status}
                      onChange={(e) => setReviewData({...reviewData, status: e.target.value})}
                    >
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                      <option value="under_review">Under Review</option>
                    </select>
                  </div>
                  
                  <div className="review-actions">
                    <button 
                      onClick={() => handleReview(submission.id)}
                      className="btn-primary"
                    >
                      Submit Review
                    </button>
                    <button 
                      onClick={() => setReviewing(null)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setReviewing(submission.id)}
                  className="btn-primary"
                >
                  Review Assignment
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentReview;