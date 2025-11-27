import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ExamComponent.css';

const ExamComponent = () => {
  const { courseId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  useEffect(() => {
    checkAssignmentApproval();
  }, [courseId]);

  // Check if exam already taken
  const checkExistingExamSubmission = async (examId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/exam-submissions/?exam=${examId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const submissions = await response.json();
        const mySubmission = submissions.find(sub => sub.student === user.id);
        
        if (mySubmission) {
          setAlreadyTaken(true);
          alert(`You have already taken this exam. Score: ${mySubmission.score}% - ${mySubmission.passed ? 'PASSED' : 'FAILED'}`);
          navigate(`/learn-sequential/${courseId}`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking exam submission:', error);
      return false;
    }
  };

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
        console.log('Available exams for course:', exams);
        
        if (exams.length > 0) {
          const examData = exams[0];
          setExam(examData);
          console.log('Selected exam:', examData);
          
          // Check if already taken
          const taken = await checkExistingExamSubmission(examData.id);
          if (taken) return;
          
          // Fetch questions for this exam
          await fetchQuestions(examData.id);
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

  const fetchQuestions = async (examId) => {
    try {
      console.log('📝 Fetching questions for exam:', examId);
      
      const questionsResponse = await fetch(`http://localhost:8000/api/questions/?exam_id=${examId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        console.log('Raw questions data:', questionsData);
        
        // Fetch choices for each question
        const questionsWithChoices = await Promise.all(
          questionsData.map(async (question) => {
            const choicesResponse = await fetch(`http://localhost:8000/api/choices/?question_id=${question.id}`, {
              headers: { 'Authorization': `Token ${token}` }
            });
            
            if (choicesResponse.ok) {
              const choicesData = await choicesResponse.json();
              console.log(`Choices for question ${question.id}:`, choicesData);
              
              return {
                ...question,
                text: question.question_text,
                choices: choicesData.map(choice => ({
                  ...choice,
                  text: choice.choice_text
                }))
              };
            }
            return question;
          })
        );
        
        console.log('✅ Questions with choices:', questionsWithChoices);
        setQuestions(questionsWithChoices);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_choice_id: choiceId
      }
    }));
    console.log('Current answers:', answers);
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    
    // Prevent submission if already taken
    if (alreadyTaken) {
      alert('You have already taken this exam and cannot retake it.');
      return;
    }
    
    setSubmitting(true);

    try {
      // Convert answers object to array
      const answersArray = Object.values(answers);
      console.log('Submitting exam with answers:', answersArray);
      
      const response = await fetch(`http://localhost:8000/api/exam-submissions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          exam: exam.id,
          answers: answersArray,
          student: user.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Exam submission successful:', result);
        
        alert(`Exam submitted! Score: ${result.score}% - ${result.passed ? 'PASSED' : 'FAILED'}`);
        
        if (result.passed) {
          if (result.certificate_issued) {
            console.log('🎓 Certificate issued, redirecting...');
            navigate(`/certificate/${courseId}`);
          } else {
            console.log('❌ Passed but certificate not issued - checking requirements');
            checkCertificateRequirements();
          }
        } else {
          alert('You did not pass the exam. Please contact your instructor.');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Exam submission failed:', errorData);
        alert('Error submitting exam: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error submitting exam:', error);
      alert('Error submitting exam: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const checkCertificateRequirements = async () => {
    // Check assignment status
    const assignmentResponse = await fetch(`http://localhost:8000/api/assignments/?course_id=${courseId}`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    
    if (assignmentResponse.ok) {
      const assignments = await assignmentResponse.json();
      if (assignments.length > 0) {
        const assignment = assignments[0];
        const submissionResponse = await fetch(`http://localhost:8000/api/assignment-submissions/?assignment=${assignment.id}`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (submissionResponse.ok) {
          const submissions = await submissionResponse.json();
          const mySubmission = submissions.find(sub => sub.student === user.id);
          if (mySubmission && mySubmission.status !== 'approved') {
            alert('Certificate requires approved assignment. Please ensure your assignment is approved.');
            return;
          }
        }
      }
    }
    
    // Check video progress
    const progressResponse = await fetch('http://localhost:8000/api/progress/', {
      headers: { 'Authorization': `Token ${token}` }
    });
    
    if (progressResponse.ok) {
      const progressData = await progressResponse.json();
      const myProgress = progressData.filter(p => p.student === user.id);
      console.log('Video progress:', myProgress.length, 'records');
    }
    
    alert('Certificate requirements not met. Please complete all course videos and ensure assignment is approved.');
  };

  const renderQuestions = () => {
    if (questions.length === 0) {
      return <div className="no-questions">No questions available for this exam.</div>;
    }

    return questions.map((question, index) => (
      <div key={question.id} className="question-card">
        <h4>Question {index + 1}</h4>
        <p className="question-text">{question.text || question.question_text}</p>
        
        <div className="choices">
          {question.choices && question.choices.map(choice => (
            <label key={choice.id} className="choice-label">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={choice.id}
                onChange={(e) => handleAnswerChange(question.id, choice.id)}
              />
              <span className="choice-text">{choice.text || choice.choice_text}</span>
            </label>
          ))}
        </div>
      </div>
    ));
  };

  if (loading) return <div className="loading">Loading exam...</div>;
  if (!exam) return <div className="no-exam">No exam available</div>;
  if (alreadyTaken) return <div className="already-taken">You have already taken this exam.</div>;

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
          {renderQuestions()}
        </div>

        <button 
          type="submit" 
          disabled={submitting || Object.keys(answers).length === 0 || alreadyTaken} 
          className="btn-primary"
        >
          {submitting ? 'Submitting...' : `Submit Exam (${Object.keys(answers).length}/${questions.length} answered)`}
        </button>
      </form>
    </div>
  );
};

export default ExamComponent;