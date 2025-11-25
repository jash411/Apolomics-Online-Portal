import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AssignmentSubmission.css';

const AssignmentSubmission = ({ courseId, onComplete }) => {
  const { token } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [courseId]);

  const fetchAssignment = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/assignments/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      
      if (data.length > 0) {
        setAssignment(data[0]);
        checkSubmission(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      setLoading(false);
    }
  };

  const checkSubmission = async (assignmentId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/assignment-submissions/?assignment=${assignmentId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      
      if (data.length > 0) {
        setSubmission(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking submission:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('assignment', assignment.id);
    formData.append('submission_text', submissionText);
    if (submissionFile) {
      formData.append('submission_file', submissionFile);
    }

    try {
      const response = await fetch('http://localhost:8000/api/assignment-submissions/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setSubmission(result);
        alert('Assignment submitted successfully! Wait for instructor review.');
      } else {
        alert('Error submitting assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error submitting assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading assignment...</div>;
  if (!assignment) return <div>No assignment found for this course.</div>;

  return (
    <div className="assignment-submission">
      <h2>📝 Course Assignment</h2>
      
      <div className="assignment-details">
        <h3>{assignment.title}</h3>
        <p>{assignment.description}</p>
        {assignment.due_date && (
          <p><strong>Due Date:</strong> {new Date(assignment.due_date).toLocaleDateString()}</p>
        )}
        <p><strong>Max Score:</strong> {assignment.max_score}</p>
      </div>

      {submission ? (
        <div className="submission-status">
          <h4>Your Submission Status: {submission.status}</h4>
          {submission.submission_text && (
            <div className="submission-content">
              <h5>Your Answer:</h5>
              <p>{submission.submission_text}</p>
            </div>
          )}
          {submission.feedback && (
            <div className="instructor-feedback">
              <h5>Instructor Feedback:</h5>
              <p>{submission.feedback}</p>
              {submission.score && <p><strong>Score:</strong> {submission.score}/{assignment.max_score}</p>}
            </div>
          )}
          
          {submission.status === 'approved' && (
            <button className="continue-button" onClick={onComplete}>
              Continue to Exam →
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="submission-form">
          <div className="form-group">
            <label htmlFor="submissionText">Your Answer:</label>
            <textarea
              id="submissionText"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows="10"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="submissionFile">Upload File (Optional):</label>
            <input
              type="file"
              id="submissionFile"
              onChange={(e) => setSubmissionFile(e.target.files[0])}
            />
          </div>
          
          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AssignmentSubmission;