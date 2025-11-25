import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ModernVideoPlayer from '../components/ModernVideoPlayer';
import './CoursePlayer.css';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      
      const courseResponse = await fetch(`http://localhost:8000/api/courses/${courseId}/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course');
      }
      
      const courseData = await courseResponse.json();
      setCourse(courseData);

      const lecturesResponse = await fetch(`http://localhost:8000/api/video-lectures/?course_id=${courseId}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (!lecturesResponse.ok) {
        throw new Error('Failed to fetch lectures');
      }
      
      const lecturesData = await lecturesResponse.json();
      setLectures(lecturesData);
      
      if (lecturesData.length > 0) {
        setCurrentLecture(lecturesData[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching course data:', error);
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleLectureSelect = (lecture) => {
    setCurrentLecture(lecture);
  };

  if (loading) {
    return (
      <div className="course-player-loading">
        <div className="loading-spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  return (
    <div className="course-player-container">
      <div className="course-player-header">
        <button onClick={() => navigate('/courses')} className="back-button">
          ← Back to Courses
        </button>
        <h1>{course?.title || 'Course Not Found'}</h1>
        <p>{course?.description || 'No description available'}</p>
      </div>

      <div className="course-player-content">
        <div className="video-section">
          {currentLecture ? (
            <ModernVideoPlayer
              videoURL={currentLecture.video_file}
              title={currentLecture.title}
            />
          ) : (
            <div className="no-lecture">
              <h3>No lecture selected</h3>
              <p>Choose a lecture from the list to start learning</p>
            </div>
          )}
        </div>

        <div className="lectures-section">
          <div className="lectures-header">
            <h3>Course Lectures</h3>
            <span>{lectures.length} lecture{lectures.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="lectures-list">
            {lectures.length === 0 ? (
              <div className="empty-lectures">
                <div className="empty-icon">📹</div>
                <p>No lectures available</p>
              </div>
            ) : (
              lectures.map((lecture, index) => (
                <div
                  key={lecture.id}
                  className={`lecture-item ${currentLecture?.id === lecture.id ? 'active' : ''}`}
                  onClick={() => handleLectureSelect(lecture)}
                >
                  <div className="lecture-number">{index + 1}</div>
                  <div className="lecture-info">
                    <h4>{lecture.title}</h4>
                    <p>{lecture.duration ? `${Math.floor(lecture.duration / 60)}:${(lecture.duration % 60).toString().padStart(2, '0')}` : '10:00'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;