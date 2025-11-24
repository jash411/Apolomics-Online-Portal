import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const { user } = useAuth();

  const getThumbnailUrl = (thumbnailPath) => {
    if (!thumbnailPath) return null;
    if (thumbnailPath.startsWith('http')) return thumbnailPath;
    return `http://localhost:8000${thumbnailPath}`;
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/courses/');
        setCourses(response.data);

        if (user && user.user_type === 'student') {
          const status = {};
          for (const course of response.data) {
            try {
              const statusResponse = await axios.get(
                `http://localhost:8000/api/courses/${course.id}/enrollment_status/`
              );
              status[course.id] = statusResponse.data.is_enrolled;
            } catch (error) {
              console.error(`Error fetching status for course ${course.id}:`, error);
              status[course.id] = false;
            }
          }
          setEnrollmentStatus(status);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const handleEnroll = async (courseId) => {
    if (!user) {
      alert('Please login to enroll in courses');
      return;
    }

    if (user.user_type !== 'student') {
      alert('Only students can enroll in courses');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8000/api/courses/${courseId}/enroll/`);
      alert(response.data.message || 'Successfully enrolled in course!');
      
      setEnrollmentStatus(prev => ({
        ...prev,
        [courseId]: true
      }));
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.error || 'Already enrolled in this course');
      } else {
        alert('Failed to enroll in course');
      }
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="container courses-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container courses-container">
      <div className="courses-header">
        <h1>Explore Our Courses 📚</h1>
        <p>Discover comprehensive apologetics courses to strengthen your faith</p>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-card">
        <div className="search-filter-grid">
          <div>
            <label className="search-filter-label">🔍 Search Courses</label>
            <input
              type="text"
              placeholder="Search by course title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div>
            <label className="search-filter-label">🎯 Filter by Level</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No courses found</h3>
          <p>Try adjusting your search criteria or check back later for new courses.</p>
          <button 
            onClick={() => { setSearchTerm(''); setFilterLevel('all'); }} 
            className="btn btn-primary"
          >
            Show All Courses
          </button>
        </div>
      ) : (
        <div>
          <div className="results-info">
            <p>Showing {filteredCourses.length} of {courses.length} courses</p>
            {searchTerm || filterLevel !== 'all' ? (
              <button 
                onClick={() => { setSearchTerm(''); setFilterLevel('all'); }}
                className="btn btn-outline"
              >
                Clear Filters
              </button>
            ) : null}
          </div>

          <div className="courses-grid-enhanced">
            {filteredCourses.map(course => (
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
                      <strong>⏱️ Duration:</strong> 
                      <span>{course.duration_hours} hours</span>
                    </div>
                    <div className="course-meta-item">
                      <strong>💰 Price:</strong> 
                      <span className="course-price">${parseFloat(course.price).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="course-actions-enhanced">
                    {user && user.user_type === 'student' ? (
                      enrollmentStatus[course.id] ? (
                        <button className="btn btn-success" disabled style={{ flex: 1 }}>
                          ✅ Enrolled
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleEnroll(course.id)}
                          style={{ flex: 1 }}
                        >
                          Enroll Now
                        </button>
                      )
                    ) : user && user.user_type === 'instructor' ? (
                      <Link to={`/learn/${course.id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                        View Course
                      </Link>
                    ) : (
                      <Link to="/login" className="btn btn-primary" style={{ flex: 1 }}>
                        Login to Enroll
                      </Link>
                    )}
                    <Link to={`/courses/${course.id}`} className="btn btn-outline">
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;