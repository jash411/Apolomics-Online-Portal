import React, { useState, useEffect, useCallback } from 'react';
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

  // Wrap fetchMyCourses with useCallback to prevent infinite re-renders
  const fetchMyCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the same endpoint as Dashboard - returns only enrolled courses
      const response = await fetch('http://127.0.0.1:8000/api/courses/my_courses/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const coursesData = await response.json();
      
      console.log('📚 Enrolled courses data:', coursesData);

      // Use real data from API - no need for fake data
      const enrolledCourses = coursesData.map(course => ({
        id: course.id,
        title: course.title || 'Untitled Course',
        description: course.description || 'No description available',
        thumbnail: course.thumbnail, // Use actual thumbnail from API
        instructor_name: course.instructor_name || 'Unknown Instructor',
        level: course.level || 'beginner',
        duration: course.duration || 0,
        progress_percentage: course.progress_percentage || 0, // Use real progress from API
        price: course.price || "0.00",
        category: 'Apologetics', // Default category since not in API
        rating: 4.5, // Default rating
        students: 0, // Default students count
        is_enrolled: course.is_enrolled !== false // Use actual enrollment status
      })).filter(course => course.is_enrolled); // Ensure only enrolled courses

      setCourses(enrolledCourses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      setError(error.message || 'Failed to load your courses. Please try again.');
      setLoading(false);
    }
  }, [token]); // Add token as dependency

  useEffect(() => {
    if (!token) {
      setError('Please log in to view your courses.');
      setLoading(false);
      return;
    }
    fetchMyCourses();
  }, [token, fetchMyCourses]); // Now fetchMyCourses is stable

  const handleContinueLearning = (courseId) => {
    navigate(`/learn-sequential/${courseId}`);
  };

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  // Filter courses based on real progress from API
  const filteredCourses = courses.filter(course => {
    const progress = course.progress_percentage || 0;
    
    if (activeFilter === 'all') return true;
    if (activeFilter === 'in-progress') return progress > 0 && progress < 100;
    if (activeFilter === 'completed') return progress === 100;
    if (activeFilter === 'not-started') return progress === 0;
    return true;
  });

  // Get course status based on real progress
  const getCourseStatus = (course) => {
    const progress = course.progress_percentage || 0;
    if (progress === 100) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'not-started';
  };

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
          <h2>Unable to Load Your Courses</h2>
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
              <span className="stat-label">Enrolled Courses</span>
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
            <h3>
              {activeFilter === 'all' ? 'No enrolled courses yet' : 'No courses match this filter'}
            </h3>
            <p>
              {activeFilter === 'all' 
                ? 'Explore our course catalog and enroll in courses to start learning!' 
                : `No ${activeFilter.replace('-', ' ')} courses found.`}
            </p>
            {activeFilter === 'all' && (
              <button 
                onClick={() => navigate('/courses')}
                className="modern-btn primary"
              >
                Browse Courses
              </button>
            )}
          </div>
        ) : (
          <div className="modern-courses-grid">
            {filteredCourses.map(course => {
              const progress = course.progress_percentage || 0;
              
              return (
                <div key={course.id} className="modern-course-card">
                  {/* Course Image */}
                  <div className="course-image-section">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title} 
                        className="course-thumbnail"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`course-thumbnail-placeholder ${course.thumbnail ? 'hidden' : ''}`}>
                      <span className="placeholder-icon">📚</span>
                      <span className="placeholder-text">{course.title}</span>
                    </div>
                    <div className="course-badges">
                      {progress === 100 && (
                        <span className="badge completed">Completed 🎉</span>
                      )}
                      {progress > 0 && progress < 100 && (
                        <span className="badge in-progress">In Progress</span>
                      )}
                      {progress === 0 && (
                        <span className="badge not-started">Not Started</span>
                      )}
                      <span className="badge level">{course.level}</span>
                    </div>
                    <div className="progress-overlay">
                      <div className="progress-track">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {progress === 100 ? 'Complete! 🎉' : `${progress}% Complete`}
                      </span>
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
                          <span className="duration">⏱️ {course.duration}h</span>
                        </div>
                      </div>
                    </div>

                    <p className="course-description">
                      {course.description.length > 120 
                        ? `${course.description.substring(0, 120)}...` 
                        : course.description
                      }
                    </p>

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
                      {progress === 0 ? (
                        <button 
                          onClick={() => handleContinueLearning(course.id)}
                          className="modern-btn primary start-learning"
                        >
                          <span className="btn-icon">🚀</span>
                          Start Learning
                        </button>
                      ) : progress === 100 ? (
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
                          Continue ({progress}%)
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;