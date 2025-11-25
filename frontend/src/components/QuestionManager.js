import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './QuestionManager.css';

const QuestionManager = ({ examId }) => {
  const { token } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/questions/?exam_id=${examId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await fetch(`http://localhost:8000/api/questions/${questionId}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` }
        });
        fetchQuestions(); // Refresh the list
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  if (loading) return <div>Loading questions...</div>;

  return (
    <div className="question-manager">
      <div className="question-header">
        <h3>Exam Questions ({questions.length})</h3>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add Question
        </button>
      </div>

      {showForm && (
        <QuestionForm
          examId={examId}
          question={editingQuestion}
          onSave={() => {
            setShowForm(false);
            setEditingQuestion(null);
            fetchQuestions();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
        />
      )}

      <div className="questions-list">
        {questions.map((question, index) => (
          <QuestionItem
            key={question.id}
            question={question}
            index={index}
            onEdit={() => {
              setEditingQuestion(question);
              setShowForm(true);
            }}
            onDelete={() => handleDeleteQuestion(question.id)}
          />
        ))}
      </div>

      {questions.length === 0 && !showForm && (
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <p>No questions added yet</p>
          <p>Add questions to create your exam</p>
        </div>
      )}
    </div>
  );
};

// Question Item Component
const QuestionItem = ({ question, index, onEdit, onDelete }) => (
  <div className="question-item">
    <div className="question-header">
      <h4>Q{index + 1}: {question.question_text}</h4>
      <div className="question-meta">
        <span className={`type-badge ${question.question_type}`}>
          {question.question_type.replace('_', ' ')}
        </span>
        <span className="score-badge">{question.score} points</span>
      </div>
    </div>
    
    <div className="question-actions">
      <button className="btn-outline" onClick={onEdit}>Edit</button>
      <button className="btn-danger" onClick={onDelete}>Delete</button>
    </div>

    {question.choices && question.choices.length > 0 && (
      <div className="choices-list">
        {question.choices.map(choice => (
          <div 
            key={choice.id} 
            className={`choice-item ${choice.is_correct ? 'correct' : ''}`}
          >
            {choice.choice_text}
            {choice.is_correct && <span className="correct-badge">✓ Correct</span>}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Question Form Component
const QuestionForm = ({ examId, question, onSave, onCancel }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    score: 10,
    choices: [{ choice_text: '', is_correct: false }]
  });

  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text,
        question_type: question.question_type,
        score: question.score,
        choices: question.choices || [{ choice_text: '', is_correct: false }]
      });
    }
  }, [question]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = question 
        ? `http://localhost:8000/api/questions/${question.id}/`
        : 'http://localhost:8000/api/questions/';
      
      const method = question ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          ...formData,
          exam: examId
        })
      });

      if (response.ok) {
        onSave();
      } else {
        alert('Error saving question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Error saving question');
    }
  };

  const handleChoiceChange = (index, field, value) => {
    const newChoices = [...formData.choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setFormData({ ...formData, choices: newChoices });
  };

  const addChoice = () => {
    setFormData({
      ...formData,
      choices: [...formData.choices, { choice_text: '', is_correct: false }]
    });
  };

  const removeChoice = (index) => {
    const newChoices = formData.choices.filter((_, i) => i !== index);
    setFormData({ ...formData, choices: newChoices });
  };

  const setCorrectAnswer = (index) => {
    const newChoices = formData.choices.map((choice, i) => ({
      ...choice,
      is_correct: i === index
    }));
    setFormData({ ...formData, choices: newChoices });
  };

  return (
    <div className="question-form-overlay">
      <div className="question-form">
        <h3>{question ? 'Edit Question' : 'Add New Question'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Question Text *</label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({...formData, question_text: e.target.value})}
              placeholder="Enter your question"
              required
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Question Type *</label>
              <select
                value={formData.question_type}
                onChange={(e) => setFormData({...formData, question_type: e.target.value})}
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Score *</label>
              <input
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({...formData, score: parseInt(e.target.value)})}
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          {(formData.question_type === 'multiple_choice' || formData.question_type === 'true_false') && (
            <div className="choices-section">
              <label>Answer Choices *</label>
              {formData.choices.map((choice, index) => (
                <div key={index} className="choice-input">
                  <input
                    type="text"
                    value={choice.choice_text}
                    onChange={(e) => handleChoiceChange(index, 'choice_text', e.target.value)}
                    placeholder={`Choice ${index + 1}`}
                    required
                  />
                  <button
                    type="button"
                    className={`correct-btn ${choice.is_correct ? 'active' : ''}`}
                    onClick={() => setCorrectAnswer(index)}
                  >
                    {choice.is_correct ? '✓ Correct' : 'Mark Correct'}
                  </button>
                  {formData.choices.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeChoice(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-outline" onClick={addChoice}>
                Add Choice
              </button>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {question ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionManager;