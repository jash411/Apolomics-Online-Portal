import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Function to get full thumbnail URL
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

  if (loading) {
    return (
      <div className="container">
        <h1>Available Courses</h1>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Available Courses</h1>
      
      {courses.length === 0 ? (
        <div className="card">
          <h3>No courses available</h3>
          <p>Check back later for new courses.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-thumbnail-container">
                {course.thumbnail ? (
                  <img 
                    src={getThumbnailUrl(course.thumbnail)} 
                    alt={course.title}
                    className="course-thumbnail"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="thumbnail-placeholder" style={{display: course.thumbnail ? 'none' : 'flex'}}>
                  <span>📚</span>
                </div>
              </div>
              
              <div className="course-content">
                <h3>{course.title}</h3>
                <p className="course-description">{course.description}</p>
                <div className="course-details">
                  <p><strong>Instructor:</strong> {course.instructor_name}</p>
                  <p><strong>Level:</strong> <span className={`level-badge level-${course.level}`}>{course.level}</span></p>
                  <p><strong>Duration:</strong> {course.duration_hours} hours</p>
                  <p><strong>Price:</strong> ${parseFloat(course.price).toFixed(2)}</p>
                </div>
                
                <div className="course-actions">
                  {user && user.user_type === 'student' ? (
                    enrollmentStatus[course.id] ? (
                      <button className="btn btn-success" disabled>
                        ✓ Already Enrolled
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleEnroll(course.id)}
                      >
                        Enroll Now
                      </button>
                    )
                  ) : user && user.user_type === 'instructor' ? (
                    <Link to={`/learn/${course.id}`} className="btn btn-secondary">
                      View Course
                    </Link>
                  ) : (
                    <Link to="/login" className="btn btn-primary">
                      Login to Enroll
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;