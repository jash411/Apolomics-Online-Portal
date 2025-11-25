import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AssignmentSubmission.css';

const AssignmentSubmission = () => {
  const { courseId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [formData, setFormData] = useState({
    submission_text: '',
    submission_file: null
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignmentData();
  }, [courseId]);

  // Add this useEffect to periodically check for status updates
  useEffect(() => {
    if (submission && (submission.status === 'submitted' || submission.status === 'under_review')) {
      // Check for status updates every 5 seconds if still under review
      const interval = setInterval(() => {
        console.log('🔄 Checking for assignment status update...');
        fetchAssignmentData();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [submission, courseId]);

  const fetchAssignmentData = async () => {
    try {
      console.log('📋 Fetching assignment data...');
      // Fetch assignment for this course
      const assignmentResponse = await fetch(`http://localhost:8000/api/assignments/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (assignmentResponse.ok) {
        const assignments = await assignmentResponse.json();
        console.log('📦 Assignments found:', assignments);
        
        if (assignments.length > 0) {
          setAssignment(assignments[0]);
          
          // Check if user already submitted
          const submissionResponse = await fetch(`http://localhost:8000/api/assignment-submissions/?assignment=${assignments[0].id}`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          if (submissionResponse.ok) {
            const submissions = await submissionResponse.json();
            console.log('📦 Submissions found:', submissions);
            
            if (submissions.length > 0) {
              const currentSubmission = submissions[0];
              console.log('🎯 Current submission status:', currentSubmission.status);
              setSubmission(currentSubmission);
              
              // If approved, log it clearly
              if (currentSubmission.status === 'approved') {
                console.log('🎉 ASSIGNMENT APPROVED - Student can take exam!');
              }
            } else {
              setSubmission(null);
            }
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('assignment', assignment.id);
      submitData.append('submission_text', formData.submission_text);
      
      if (formData.submission_file) {
        submitData.append('submission_file', formData.submission_file);
      }

      const response = await fetch('http://localhost:8000/api/assignment-submissions/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: submitData
      });

      if (response.ok) {
        alert('Assignment submitted successfully!');
        fetchAssignmentData(); // Refresh data
      } else {
        alert('Error submitting assignment');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading assignment...</div>;
  }

  if (!assignment) {
    return (
      <div className="assignment-container">
        <div className="no-assignment">
          <h2>No Assignment Available</h2>
          <p>This course doesn't have any assignments yet.</p>
          <button onClick={() => navigate(`/learn-sequential/${courseId}`)} className="btn-primary">
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-container">
      <div className="assignment-header">
        <button onClick={() => navigate(`/learn-sequential/${courseId}`)} className="back-button">
          ← Back to Course
        </button>
        <h1>{assignment.title}</h1>
      </div>

      <div className="assignment-content">
        <div className="assignment-info">
          <h2>Assignment Details</h2>
          <p>{assignment.description}</p>
          <div className="assignment-meta">
            <span>Max Score: {assignment.max_score}</span>
            {assignment.due_date && (
              <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {submission ? (
          <div className="submission-status">
            <h3>Your Submission</h3>
            <div className={`status-badge ${submission.status}`}>
              Status: {submission.status.replace('_', ' ').toUpperCase()}
            </div>
            
            {submission.submission_text && (
              <div className="submission-text">
                <h4>Your Answer:</h4>
                <p>{submission.submission_text}</p>
              </div>
            )}
            
            {submission.score && (
              <div className="submission-score">
                <h4>Score: {submission.score}/{assignment.max_score}</h4>
              </div>
            )}
            
            {submission.feedback && (
              <div className="submission-feedback">
                <h4>Instructor Feedback:</h4>
                <p>{submission.feedback}</p>
              </div>
            )}

            {/* NEXT STEPS BASED ON STATUS */}
            <div className="next-steps">
              {submission.status === 'approved' && (
                <>
                  <h4 className="success-message">🎉 Assignment Approved!</h4>
                  <p>Congratulations! Your assignment has been approved. You can now take the final exam.</p>
                  <div className="exam-actions">
                    <button 
                      onClick={() => navigate(`/exam/${courseId}`)}
                      className="btn-success"
                    >
                      Take Final Exam
                    </button>
                    <button 
                      onClick={() => navigate(`/learn-sequential/${courseId}`)}
                      className="btn-outline"
                    >
                      Back to Course
                    </button>
                  </div>
                </>
              )}
              
              {submission.status === 'rejected' && (
                <>
                  <h4 className="error-message">❌ Assignment Needs Revision</h4>
                  <p>Please review the instructor's feedback and resubmit your assignment.</p>
                  <button 
                    onClick={() => {
                      setSubmission(null);
                      setFormData({ submission_text: '', submission_file: null });
                    }}
                    className="btn-primary"
                  >
                    Resubmit Assignment
                  </button>
                </>
              )}
              
              {(submission.status === 'submitted' || submission.status === 'under_review') && (
                <>
                  <h4 className="info-message">⏳ Under Review</h4>
                  <p>Your assignment is being reviewed by the instructor.</p>
                  <p>You'll be able to take the final exam once it's approved.</p>
                  <div className="review-info">
                    <p><strong>What happens next?</strong></p>
                    <ul>
                      <li>Instructor reviews your submission</li>
                      <li>You'll receive a score and feedback</li>
                      <li>If approved, the final exam will unlock</li>
                      <li>If rejected, you can resubmit with improvements</li>
                    </ul>
                  </div>
                  <button 
                    onClick={fetchAssignmentData}
                    className="btn-outline"
                  >
                    Check Status
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="submission-form">
            <h3>Submit Your Assignment</h3>
            
            <div className="form-group">
              <label>Your Answer (Text)</label>
              <textarea
                value={formData.submission_text}
                onChange={(e) => setFormData({...formData, submission_text: e.target.value})}
                rows="6"
                placeholder="Write your assignment answer here..."
                required
              />
            </div>

            <div className="form-group">
              <label>Or Upload File (Optional)</label>
              <input
                type="file"
                onChange={(e) => setFormData({...formData, submission_file: e.target.files[0]})}
                accept=".pdf,.doc,.docx,.txt"
              />
              <small>Supported formats: PDF, DOC, DOCX, TXT</small>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AssignmentSubmission;