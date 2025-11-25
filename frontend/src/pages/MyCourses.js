import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MyCourses.css';

const MyCourses = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!token) {
      setError('Please log in to view your courses.');
      setLoading(false);
      return;
    }
    fetchMyCourses();
  }, [token, user]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://127.0.0.1:8000/api/courses/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const coursesData = await response.json();
      
      const availableCourses = coursesData.map(course => ({
        id: course.id,
        title: course.title || 'Untitled Course',
        description: course.description || 'No description available',
        thumbnail: course.thumbnail,
        instructor_name: course.instructor_name || (course.instructor && course.instructor.username) || 'Unknown Instructor',
        level: course.level || 'Beginner',
        duration: course.duration || 0,
        progress_percentage: Math.floor(Math.random() * 100), // Simulated progress
        price: course.price || 0,
        category: course.category || 'Development',
        rating: course.rating || 4.5,
        students: course.students || Math.floor(Math.random() * 1000),
        is_published: course.is_published !== false
      })).filter(course => course.is_published);

      setCourses(availableCourses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error.message || 'Failed to load courses. Please try again.');
      setLoading(false);
    }
  };

 // Change the handleContinueLearning function:
    const handleContinueLearning = (courseId) => {
      navigate(`/learn-sequential/${courseId}`); // Changed from /learn to /learn-sequential
    };

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const filteredCourses = courses.filter(course => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'in-progress') return course.progress_percentage > 0 && course.progress_percentage < 100;
    if (activeFilter === 'completed') return course.progress_percentage === 100;
    if (activeFilter === 'not-started') return course.progress_percentage === 0;
    return true;
  });

  if (loading) {
    return (
      <div className="modern-courses">
        <div className="courses-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="course-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line long"></div>
                <div className="skeleton-actions"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-courses">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Unable to Load Courses</h2>
          <p>{error}</p>
          <button onClick={fetchMyCourses} className="modern-btn primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-courses">
      {/* Header Section */}
      <div className="courses-hero">
        <div className="hero-content">
          <h1>My Learning Journey</h1>
          <p>Continue where you left off and discover new skills</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">{courses.length}</span>
              <span className="stat-label">Total Courses</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {courses.filter(c => c.progress_percentage === 100).length}
              </span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {courses.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length}
              </span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="courses-filters">
        <div className="filter-buttons">
          {[
            { key: 'all', label: 'All Courses', icon: '📚' },
            { key: 'in-progress', label: 'In Progress', icon: '🎯' },
            { key: 'completed', label: 'Completed', icon: '✅' },
            { key: 'not-started', label: 'Not Started', icon: '🆕' }
          ].map(filter => (
            <button
              key={filter.key}
              className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              <span className="filter-icon">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-container">
        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>No courses found</h3>
            <p>No courses match your current filter selection.</p>
            <button 
              onClick={() => setActiveFilter('all')}
              className="modern-btn secondary"
            >
              View All Courses
            </button>
          </div>
        ) : (
          <div className="modern-courses-grid">
            {filteredCourses.map(course => (
              <div key={course.id} className="modern-course-card">
                {/* Course Image */}
                <div className="course-image-section">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="course-thumbnail" />
                  ) : (
                    <div className="course-thumbnail-placeholder">
                      <span className="placeholder-icon">📚</span>
                    </div>
                  )}
                  <div className="course-badges">
                    {course.progress_percentage === 100 && (
                      <span className="badge completed">Completed 🎉</span>
                    )}
                    {course.progress_percentage > 0 && course.progress_percentage < 100 && (
                      <span className="badge in-progress">In Progress</span>
                    )}
                    <span className="badge level">{course.level}</span>
                  </div>
                  <div className="progress-overlay">
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${course.progress_percentage}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{course.progress_percentage}% Complete</span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="course-content-section">
                  <div className="course-header">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-meta">
                      <span className="instructor">By {course.instructor_name}</span>
                      <div className="course-rating">
                        <span className="stars">⭐ {course.rating}</span>
                        <span className="students">👥 {course.students}</span>
                      </div>
                    </div>
                  </div>

                  <p className="course-description">{course.description}</p>

                  <div className="course-details">
                    <div className="detail-item">
                      <span className="detail-icon">⏱️</span>
                      <span>{course.duration}h</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📁</span>
                      <span>{course.category}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🎯</span>
                      <span>{course.level}</span>
                    </div>
                  </div>

                  {/* Course Actions */}
                  <div className="course-actions">
                    {course.progress_percentage === 0 ? (
                      <button 
                        onClick={() => handleContinueLearning(course.id)}
                        className="modern-btn primary start-learning"
                      >
                        <span className="btn-icon">🚀</span>
                        Start Learning
                      </button>
                    ) : course.progress_percentage === 100 ? (
                      <button 
                        onClick={() => handleViewCourse(course.id)}
                        className="modern-btn success review-course"
                      >
                        <span className="btn-icon">📖</span>
                        Review Course
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleContinueLearning(course.id)}
                        className="modern-btn primary continue-learning"
                      >
                        <span className="btn-icon">▶️</span>
                        Continue ({course.progress_percentage}%)
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleViewCourse(course.id)}
                      className="modern-btn ghost"
                    >
                      <span className="btn-icon">👁️</span>
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;