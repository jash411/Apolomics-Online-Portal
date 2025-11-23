import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔍 Fetching my courses for user:', user?.username);
        console.log('🔍 Token exists:', !!token);
        
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Use the correct endpoint for enrolled courses
        const response = await axios.get('http://localhost:8000/api/courses/my_courses/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        console.log('✅ My courses API response status:', response.status);
        console.log('✅ My courses API response data:', response.data);
        console.log('✅ Number of courses:', response.data.length);
        
        setCourses(response.data);
        setError('');
      } catch (error) {
        console.error('❌ Error fetching my courses:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error message:', error.message);
        
        if (error.response) {
          // Server responded with error status
          setError(`Server error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          // Request was made but no response received
          setError('No response from server. Check if backend is running.');
        } else {
          // Something else happened
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

  // Function to get thumbnail URL
  const getThumbnailUrl = (thumbnailPath) => {
    if (!thumbnailPath) return null;
    if (thumbnailPath.startsWith('http')) return thumbnailPath;
    return `http://localhost:8000${thumbnailPath}`;
  };

  if (loading) {
    return (
      <div className="container">
        <h1>My Learning</h1>
        <p>Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>My Learning</h1>
        <div className="error-message" style={{ 
          color: 'red', 
          padding: '1rem', 
          background: '#ffe6e6', 
          borderRadius: '4px',
          border: '1px solid #ffcccc',
          margin: '10px 0'
        }}>
          <strong>Error:</strong> {error}
          <br />
          <small>Check browser console for details</small>
        </div>
        <Link to="/courses" className="btn btn-primary">
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>My Learning</h1>
      <p>Your enrolled courses</p>
      
      {courses.length === 0 ? (
        <div className="card" style={{ 
          background: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3>No courses enrolled yet</h3>
          <p>You haven't enrolled in any courses yet. <Link to="/courses">Browse available courses</Link> to get started with your learning journey.</p>
          <Link to="/courses" className="btn btn-primary" style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            Browse Courses
          </Link>
        </div>
      ) : (
        <div>
          <p>You are enrolled in {courses.length} course{courses.length !== 1 ? 's' : ''}</p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '20px', 
            marginTop: '20px' 
          }}>
            {courses.map(course => (
              <div key={course.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '16px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {course.thumbnail && (
                  <img 
                    src={getThumbnailUrl(course.thumbnail)} 
                    alt={course.title}
                    style={{ 
                      width: '100%', 
                      height: '160px', 
                      objectFit: 'cover', 
                      borderRadius: '4px', 
                      marginBottom: '12px' 
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <h3 style={{ margin: '0 0 8px 0' }}>{course.title}</h3>
                <p style={{ margin: '0 0 8px 0', color: '#666' }}>{course.description}</p>
                <p style={{ margin: '4px 0' }}><strong>Instructor:</strong> {course.instructor_name}</p>
                <p style={{ margin: '4px 0' }}><strong>Level:</strong> {course.level}</p>
                <p style={{ margin: '4px 0 12px 0' }}><strong>Duration:</strong> {course.duration_hours} hours</p>
                
                <Link 
                  to={`/learn/${course.id}`} 
                  style={{ 
                    display: 'block', 
                    marginTop: '10px', 
                    padding: '10px 16px', 
                    background: '#007bff', 
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}
                >
                  Continue Learning
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;