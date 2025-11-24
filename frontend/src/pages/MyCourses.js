import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './MyCourses.css';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:8000/api/courses/my_courses/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        setCourses(response.data);
        setError('');
      } catch (error) {
        console.error('Error fetching my courses:', error);
        
        if (error.response) {
          setError(`Server error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          setError('No response from server. Check if backend is running.');
        } else {
          setError('Error: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyCourses();
    } else {
      setLoading(false);
      setError('Please log in to view your courses.');
    }
  }, [user]);

  const getThumbnailUrl = (thumbnailPath) => {
    if (!thumbnailPath) return null;
    if (thumbnailPath.startsWith('http')) return thumbnailPath;
    return `http://localhost:8000${thumbnailPath}`;
  };

  const getCourseProgress = (courseId) => {
    const progressMap = {
      1: 75,
      2: 40,
      3: 100,
      4: 20,
      5: 60
    };
    return progressMap[courseId] || Math.floor(Math.random() * 100);
  };

  if (loading) {
    return (
      <div className="container mycourses-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mycourses-container">
        <div className="mycourses-header">
          <h1>My Learning Journey 📖</h1>
          <p>Your enrolled courses and learning progress</p>
        </div>
        
        <div className="error-message">
          <strong>⚠️ Error Loading Courses:</strong> {error}
          <br />
          <small>Check browser console for technical details</small>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/courses" className="btn btn-primary">
            Browse Available Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mycourses-container">
      <div className="mycourses-header">
        <h1>My Learning Journey 📖</h1>
        <p>Your enrolled courses and learning progress</p>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No Courses Enrolled Yet</h3>
          <p>Start your apologetics learning journey by enrolling in our comprehensive courses</p>
          <div className="learning-actions">
            <Link to="/courses" className="btn btn-primary">
              Browse Courses
            </Link>
            <Link to="/courses?level=beginner" className="btn btn-outline">
              Start with Beginner Courses
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{courses.length}</div>
              <div className="stat-label">Enrolled Courses</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {Math.round(courses.reduce((acc, course) => acc + getCourseProgress(course.id), 0) / courses.length)}%
              </div>
              <div className="stat-label">Average Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {courses.filter(course => getCourseProgress(course.id) === 100).length}
              </div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {courses.reduce((acc, course) => acc + course.duration_hours, 0)}
              </div>
              <div className="stat-label">Total Hours</div>
            </div>
          </div>

          <div className="mycourses-stats">
            <h2>Your Courses ({courses.length})</h2>
            <p>Continue your learning journey and track your progress</p>
          </div>

          <div className="courses-grid-enhanced">
            {courses.map(course => {
              const progress = getCourseProgress(course.id);
              return (
                <div key={course.id} className="course-card-enhanced fade-in-up">
                  <div className="course-thumbnail-enhanced">
                    {course.thumbnail ? (
                      <img 
                        src={getThumbnailUrl(course.thumbnail)} 
                        alt={course.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="thumbnail-placeholder" style={{display: course.thumbnail ? 'none' : 'flex'}}>
                      <span>📚</span>
                    </div>
                    <span className={`course-level-badge level-${course.level}`}>
                      {course.level}
                    </span>
                    
                    {progress > 0 && (
                      <div className="progress-overlay">
                        <div className="progress-overlay-content">
                          <span>Progress: {progress}%</span>
                          {progress === 100 && <span>🎉 Complete!</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="course-content-enhanced">
                    <h3>{course.title}</h3>
                    <p className="course-description-enhanced">{course.description}</p>
                    
                    <div className="course-meta">
                      <div className="course-meta-item">
                        <strong>👨‍🏫 Instructor:</strong> 
                        <span>{course.instructor_name}</span>
                      </div>
                      <div className="course-meta-item">
                        <strong>📊 Level:</strong> 
                        <span style={{ textTransform: 'capitalize' }}>{course.level}</span>
                      </div>
                      <div className="course-meta-item">
                        <strong>⏱️ Duration:</strong> 
                        <span>{course.duration_hours} hours</span>
                      </div>
                    </div>

                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {progress === 100 ? 'Course Completed! 🎓' : `${progress}% Complete`}
                    </div>
                    
                    <div className="course-actions-enhanced">
                      <Link 
                        to={`/learn/${course.id}`} 
                        className={progress === 100 ? 'btn-review' : 'btn-continue'}
                        style={{ flex: 1 }}
                      >
                        {progress === 0 ? 'Start Learning' : progress === 100 ? 'Review Course' : 'Continue Learning'}
                      </Link>
                      <Link to={`/courses/${course.id}`} className="btn btn-outline">
                        Course Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;