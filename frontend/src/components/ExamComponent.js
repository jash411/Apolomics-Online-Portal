import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ExamComponent.css';

const ExamComponent = () => {
  const { courseId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAssignmentApproval();
  }, [courseId]);

  const checkAssignmentApproval = async () => {
    try {
      // First, check if assignment is approved
      const assignmentResponse = await fetch(`http://localhost:8000/api/assignments/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (assignmentResponse.ok) {
        const assignments = await assignmentResponse.json();
        if (assignments.length > 0) {
          const assignment = assignments[0];
          
          // Check submission status
          const submissionResponse = await fetch(`http://localhost:8000/api/assignment-submissions/?assignment=${assignment.id}`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          if (submissionResponse.ok) {
            const submissions = await submissionResponse.json();
            if (submissions.length > 0 && submissions[0].status === 'approved') {
              // Assignment approved, load exam
              fetchExam();
            } else {
              alert('Your assignment must be approved before taking the exam.');
              navigate(`/assignment/${courseId}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking assignment approval:', error);
      setLoading(false);
    }
  };

  const fetchExam = async () => {
    try {
      // Fetch exam for this course
      const response = await fetch(`http://localhost:8000/api/exams/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const exams = await response.json();
        if (exams.length > 0) {
          setExam(exams[0]);
        } else {
          alert('No exam available for this course yet.');
          navigate(`/learn-sequential/${courseId}`);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exam:', error);
      setLoading(false);
    }
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`http://localhost:8000/api/exams/${exam.id}/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          answers: answers,
          student: user.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Exam submitted! Score: ${result.score}/${exam.max_score}`);
        
        if (result.passed) {
          navigate(`/certificate/${courseId}`);
        } else {
          alert('You did not pass the exam. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Error submitting exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading exam...</div>;
  if (!exam) return <div className="no-exam">No exam available</div>;

  return (
    <div className="exam-container">
      <div className="exam-header">
        <button onClick={() => navigate(`/assignment/${courseId}`)} className="back-button">
          ← Back to Assignment
        </button>
        <h1>{exam.title}</h1>
      </div>

      <form onSubmit={handleSubmitExam} className="exam-form">
        <div className="exam-info">
          <p>{exam.description}</p>
          <div className="exam-meta">
            <span>Max Score: {exam.max_score}</span>
            <span>Time Limit: {exam.time_limit} minutes</span>
          </div>
        </div>

        <div className="questions-section">
          <h3>Exam Questions</h3>
          {/* Add your questions rendering here */}
          <div className="question">
            <p>This is a sample question. Implement your actual exam questions here.</p>
            <textarea
              placeholder="Your answer..."
              rows="4"
              onChange={(e) => setAnswers({...answers, question1: e.target.value})}
            />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </form>
    </div>
  );
};

export default ExamComponent;