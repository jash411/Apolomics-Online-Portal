import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    try {
      const [coursesRes, examsRes] = await Promise.all([
        fetch('http://localhost:8000/api/courses/my_courses/', {
          headers: { 'Authorization': `Token ${token}` }
        }),
        fetch('http://localhost:8000/api/exams/', {
          headers: { 'Authorization': `Token ${token}` }
        })
      ]);
      
      const coursesData = await coursesRes.json();
      const examsData = await examsRes.json();
      
      // Filter courses taught by this instructor
      const instructorCourses = coursesData.filter(course => 
        course.instructor === user.id
      );
      
      setCourses(instructorCourses);
      setExams(examsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching instructor data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="instructor-loading">
        <div className="loading-spinner"></div>
        <p>Loading instructor dashboard...</p>
      </div>
    );
  }

  return (
    <div className="instructor-dashboard">
      <div className="dashboard-header">
        <h1>Instructor Dashboard</h1>
        <p>Welcome back, {user?.first_name || 'Instructor'}!</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>{courses.length}</h3>
            <p>Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <h3>{exams.length}</h3>
            <p>Exams</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>0</h3>
            <p>Assignments to Review</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>0</h3>
            <p>Students</p>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <div className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            My Courses
          </button>
          <button 
            className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            Exam Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            Assignment Reviews
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'courses' && (
            <CoursesTab courses={courses} />
          )}
          {activeTab === 'exams' && (
            <ExamsTab courses={courses} exams={exams} />
          )}
          {activeTab === 'assignments' && (
            <AssignmentsTab />
          )}
        </div>
      </div>
    </div>
  );
};

// Courses Tab Component
const CoursesTab = ({ courses }) => (
  <div className="courses-tab">
    <div className="tab-header">
      <h2>My Courses</h2>
      <button className="btn-primary">Create New Course</button>
    </div>
    
    <div className="courses-grid">
      {courses.map(course => (
        <div key={course.id} className="course-card">
          <div className="course-thumbnail">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} />
            ) : (
              <div className="thumbnail-placeholder">📚</div>
            )}
          </div>
          <div className="course-info">
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <div className="course-meta">
              <span>Level: {course.level}</span>
              <span>Duration: {course.duration}h</span>
            </div>
            <div className="course-actions">
              <button className="btn-outline">Manage</button>
              <button className="btn-primary">Add Exam</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Exams Tab Component
const ExamsTab = ({ courses, exams }) => (
  <div className="exams-tab">
    <div className="tab-header">
      <h2>Exam Management</h2>
      <button className="btn-primary">Create New Exam</button>
    </div>

    <div className="exams-content">
      <div className="exams-list">
        <h3>Existing Exams</h3>
        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>No exams created yet</p>
            <p>Create your first exam for a course</p>
          </div>
        ) : (
          exams.map(exam => (
            <div key={exam.id} className="exam-card">
              <div className="exam-header">
                <h4>{exam.title}</h4>
                <span className={`status ${exam.is_active ? 'active' : 'inactive'}`}>
                  {exam.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p>{exam.description}</p>
              <div className="exam-meta">
                <span>Duration: {exam.duration}min</span>
                <span>Passing: {exam.passing_score}%</span>
                <span>Questions: {exam.questions?.length || 0}</span>
              </div>
              <div className="exam-actions">
                <button className="btn-outline">Edit Exam</button>
                <button className="btn-outline">View Questions</button>
                <button className="btn-danger">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="create-exam-form">
        <h3>Create New Exam</h3>
        <ExamForm courses={courses} />
      </div>
    </div>
  </div>
);

// Exam Form Component
const ExamForm = ({ courses }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    description: '',
    duration: 60,
    passing_score: 70
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/exams/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Exam created successfully!');
        setFormData({
          course: '',
          title: '',
          description: '',
          duration: 60,
          passing_score: 70
        });
        window.location.reload();
      } else {
        alert('Error creating exam');
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Error creating exam');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="exam-form">
      <div className="form-group">
        <label>Course *</label>
        <select 
          name="course" 
          value={formData.course} 
          onChange={handleChange}
          required
        >
          <option value="">Select a course</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Exam Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter exam title"
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter exam description"
          rows="3"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Duration (minutes) *</label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="15"
            max="180"
            required
          />
        </div>

        <div className="form-group">
          <label>Passing Score (%) *</label>
          <input
            type="number"
            name="passing_score"
            value={formData.passing_score}
            onChange={handleChange}
            min="50"
            max="100"
            required
          />
        </div>
      </div>

      <button type="submit" className="btn-primary">Create Exam</button>
    </form>
  );
};

// Assignments Tab Component
const AssignmentsTab = () => (
  <div className="assignments-tab">
    <h2>Assignment Reviews</h2>
    <div className="empty-state">
      <div className="empty-icon">📝</div>
      <p>No assignments to review</p>
      <p>Student submissions will appear here for review</p>
    </div>
  </div>
);

export default InstructorDashboard;