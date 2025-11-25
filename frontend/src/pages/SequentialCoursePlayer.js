import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ModernVideoPlayer from '../components/ModernVideoPlayer';
import AssignmentSubmission from '../components/AssignmentSubmission';
import ExamComponent from '../components/ExamComponent';
import Certificate from '../components/Certificate';
import './SequentialCoursePlayer.css';

const SequentialCoursePlayer = () => {
  const { courseId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [currentStep, setCurrentStep] = useState('videos'); // videos, assignment, exam, certificate
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const [courseRes, lecturesRes] = await Promise.all([
        fetch(`http://localhost:8000/api/courses/${courseId}/`, {
          headers: { 'Authorization': `Token ${token}` }
        }),
        fetch(`http://localhost:8000/api/video-lectures/?course_id=${courseId}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
      ]);
      
      const courseData = await courseRes.json();
      const lecturesData = await lecturesRes.json();
      
      setCourse(courseData);
      setLectures(lecturesData);
      
      // Set first unlocked lecture
      const firstUnlocked = lecturesData.find(lecture => lecture.is_unlocked);
      setCurrentLecture(firstUnlocked || lecturesData[0]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching course data:', error);
      setLoading(false);
    }
  };

  const handleVideoComplete = async () => {
    if (!currentLecture) return;
    
    try {
      // Mark video as watched
      await fetch('http://localhost:8000/api/progress/update_progress/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          video_lecture: currentLecture.id,
          progress: 100,
          watched: true
        })
      });
      
      // Refresh lectures to update unlock status
      fetchCourseData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleProgressUpdate = async (progressPercent) => {
    if (!currentLecture) return;
    
    try {
      await fetch('http://localhost:8000/api/progress/update_progress/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          video_lecture: currentLecture.id,
          progress: progressPercent,
          watched: progressPercent > 90
        })
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleLectureSelect = (lecture) => {
    if (lecture.is_unlocked) {
      setCurrentLecture(lecture);
    }
  };

  const allVideosWatched = lectures.every(lecture => lecture.progress === 100);
  
  if (loading) {
    return (
      <div className="course-loading">
        <div className="loading-spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  return (
    <div className="sequential-course-container">
      <div className="course-header">
        <button onClick={() => navigate('/courses')} className="back-button">
          ← Back to Courses
        </button>
        <h1>{course?.title}</h1>
        <p>{course?.description}</p>
        
        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep === 'videos' ? 'active' : ''} ${allVideosWatched ? 'completed' : ''}`}>
            <span>1</span>
            Videos
          </div>
          <div className={`step ${currentStep === 'assignment' ? 'active' : ''}`}>
            <span>2</span>
            Assignment
          </div>
          <div className={`step ${currentStep === 'exam' ? 'active' : ''}`}>
            <span>3</span>
            Exam
          </div>
          <div className={`step ${currentStep === 'certificate' ? 'active' : ''}`}>
            <span>4</span>
            Certificate
          </div>
        </div>
      </div>

      <div className="course-content">
        {/* Left Sidebar - Navigation */}
        <div className="course-sidebar">
          <div className="sidebar-section">
            <h3>Course Content</h3>
            <div className="lectures-list">
              {lectures.map((lecture, index) => (
                <div
                  key={lecture.id}
                  className={`lecture-item ${currentLecture?.id === lecture.id ? 'active' : ''} ${lecture.is_unlocked ? 'unlocked' : 'locked'}`}
                  onClick={() => handleLectureSelect(lecture)}
                >
                  <div className="lecture-icon">
                    {lecture.is_unlocked ? (
                      lecture.progress === 100 ? '✅' : '▶️'
                    ) : (
                      '🔒'
                    )}
                  </div>
                  <div className="lecture-info">
                    <h4>Part {index + 1}: {lecture.title}</h4>
                    <p>{lecture.duration || '10:00'}</p>
                  </div>
                  {lecture.progress > 0 && lecture.progress < 100 && (
                    <div className="progress-indicator">
                      <div 
                        className="progress-bar" 
                        style={{width: `${lecture.progress}%`}}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps Navigation */}
          <div className="sidebar-section">
            <h3>Next Steps</h3>
            <div className="next-steps">
              <button 
                className={`nav-button ${allVideosWatched ? 'enabled' : 'disabled'}`}
                onClick={() => allVideosWatched && setCurrentStep('assignment')}
              >
                📝 Submit Assignment
                {allVideosWatched && ' →'}
              </button>
              
              <button className="nav-button disabled">
                🎯 Take Final Exam
              </button>
              
              <button className="nav-button disabled">
                🏆 Get Certificate
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="course-main">
          {currentStep === 'videos' && currentLecture && (
            <div className="video-section">
              <ModernVideoPlayer
                videoUrl={currentLecture.video_file}
                title={currentLecture.title}
                onProgress={handleProgressUpdate}
                onComplete={handleVideoComplete}
              />
              
              <div className="lecture-description">
                <h3>About this lecture</h3>
                <p>{currentLecture.description}</p>
              </div>
              
              {allVideosWatched && (
                <div className="completion-message">
                  <h3>🎉 All Videos Completed!</h3>
                  <p>You've successfully completed all video lectures. You can now proceed to the assignment.</p>
                  <button 
                    className="next-step-button"
                    onClick={() => setCurrentStep('assignment')}
                  >
                    Continue to Assignment →
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 'assignment' && (
            <AssignmentSubmission 
              courseId={courseId}
              onComplete={() => setCurrentStep('exam')}
            />
          )}

          {currentStep === 'exam' && (
            <ExamComponent 
              courseId={courseId}
              onComplete={() => setCurrentStep('certificate')}
            />
          )}

          {currentStep === 'certificate' && (
            <Certificate 
              courseId={courseId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SequentialCoursePlayer;