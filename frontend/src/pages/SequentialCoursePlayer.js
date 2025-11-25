import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ModernVideoPlayer from '../components/ModernVideoPlayer';
import './SequentialCoursePlayer.css';

const SequentialCoursePlayer = () => {
  const { courseId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [userProgress, setUserProgress] = useState({});

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await fetch(`http://localhost:8000/api/courses/${courseId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (!courseResponse.ok) throw new Error('Failed to fetch course');
      const courseData = await courseResponse.json();
      setCourse(courseData);

      // Fetch lectures
      const lecturesResponse = await fetch(`http://localhost:8000/api/video-lectures/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (!lecturesResponse.ok) throw new Error('Failed to fetch lectures');
      let lecturesData = await lecturesResponse.json();
      
      // Sort lectures by order
      lecturesData = lecturesData.sort((a, b) => a.order - b.order);
      setLectures(lecturesData);

      // Fetch user progress for this course
      const progressResponse = await fetch(`http://localhost:8000/api/progress/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      let progressMap = {};
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        progressData.forEach(progress => {
          progressMap[progress.video_lecture] = progress;
        });
      }
      setUserProgress(progressMap);

      // Find first unwatched lecture
      if (lecturesData.length > 0) {
        let startIndex = 0;
        for (let i = 0; i < lecturesData.length; i++) {
          const progress = progressMap[lecturesData[i].id];
          if (!progress || !progress.watched) {
            startIndex = i;
            break;
          }
        }
        
        setCurrentIndex(startIndex);
        setCurrentLecture(lecturesData[startIndex]);
        
        // Check unlock status for the current lecture
        checkUnlockStatus(lecturesData[startIndex], lecturesData, progressMap);
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

  const checkUnlockStatus = (lecture, lecturesList = lectures, progress = userProgress) => {
    console.log('Checking unlock status for lecture:', lecture.order);
    
    // First lecture is always unlocked
    if (lecture.order === 1) {
      console.log('First lecture - always unlocked');
      setIsUnlocked(true);
      return;
    }

    // Check if previous lecture is completed
    const previousLecture = lecturesList.find(l => l.order === lecture.order - 1);
    console.log('Previous lecture:', previousLecture?.order);
    
    if (previousLecture) {
      const prevProgress = progress[previousLecture.id];
      const isPreviousCompleted = prevProgress && prevProgress.watched;
      console.log('Previous lecture completed:', isPreviousCompleted);
      
      setIsUnlocked(isPreviousCompleted);
    } else {
      console.log('No previous lecture found');
      setIsUnlocked(false);
    }
  };

  const updateProgress = async (lectureId, progressPercent, watched = false) => {
    try {
      console.log('Updating progress:', { lectureId, progressPercent, watched });
      
      const response = await fetch('http://localhost:8000/api/progress/update_progress/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          video_lecture: lectureId,
          progress: progressPercent,
          watched: watched || progressPercent > 90
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Progress update successful:', result);
        
        // Update local state
        const updatedProgress = { ...userProgress };
        updatedProgress[lectureId] = {
          ...updatedProgress[lectureId],
          progress: progressPercent,
          watched: watched || progressPercent > 90
        };
        setUserProgress(updatedProgress);
        
        // If video completed, unlock the next lecture
        if ((watched || progressPercent > 90) && currentIndex < lectures.length - 1) {
          const nextLecture = lectures[currentIndex + 1];
          console.log('Video completed, checking next lecture:', nextLecture.order);
          
          // Unlock the next lecture
          setTimeout(() => {
            checkUnlockStatus(nextLecture, lectures, updatedProgress);
          }, 500);
        }
      } else {
        console.error('Progress update failed:', response.status);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleVideoProgress = (progressPercent) => {
    if (currentLecture && progressPercent % 25 === 0) { // Update every 25% to avoid too many requests
      updateProgress(currentLecture.id, progressPercent, false);
    }
  };

  const handleVideoComplete = () => {
    if (currentLecture) {
      console.log('Video completed, marking as watched');
      updateProgress(currentLecture.id, 100, true);
    }
  };

  const handleLectureSelect = (lecture, index) => {
    console.log('Lecture selected:', lecture.order, 'Index:', index);
    
    const isAccessible = checkIfLectureAccessible(lecture, index);
    
    if (isAccessible) {
      setCurrentIndex(index);
      setCurrentLecture(lecture);
      checkUnlockStatus(lecture);
    } else {
      alert('Please complete the previous lecture first!');
    }
  };

  const checkIfLectureAccessible = (lecture, index) => {
    // First lecture is always accessible
    if (index === 0) {
      return true;
    }
    
    // Check if previous lecture is completed
    const previousLecture = lectures[index - 1];
    const prevProgress = userProgress[previousLecture.id];
    const isPreviousCompleted = prevProgress && prevProgress.watched;
    
    console.log(`Lecture ${lecture.order} accessibility check:`);
    console.log('- Previous lecture:', previousLecture.order);
    console.log('- Previous completed:', isPreviousCompleted);
    console.log('- Is accessible:', isPreviousCompleted);
    
    return isPreviousCompleted;
  };

  const navigateToNext = () => {
    if (currentIndex < lectures.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextLecture = lectures[nextIndex];
      const isAccessible = checkIfLectureAccessible(nextLecture, nextIndex);
      
      if (isAccessible) {
        setCurrentIndex(nextIndex);
        setCurrentLecture(nextLecture);
        checkUnlockStatus(nextLecture);
      } else {
        alert('Please complete this lecture first!');
      }
    }
  };

  const navigateToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentLecture(lectures[prevIndex]);
      setIsUnlocked(true); // Previous lectures are always accessible once reached
    }
  };

  const getLectureStatus = (lecture, index) => {
    const progress = userProgress[lecture.id];
    const isCompleted = progress?.watched;
    const isCurrent = index === currentIndex;
    const isAccessible = checkIfLectureAccessible(lecture, index);
    
    return { isCompleted, isCurrent, isAccessible, progress: progress?.progress || 0 };
  };

  if (loading) {
    return (
      <div className="sequential-player-loading">
        <div className="loading-spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  return (
    <div className="sequential-course-player">
      {/* Header */}
      <div className="player-header">
        <button onClick={() => navigate('/my-courses')} className="back-button">
          ← Back to My Courses
        </button>
        <div className="course-info">
          <h1>{course?.title}</h1>
          <p>Part {currentIndex + 1} of {lectures.length}</p>
        </div>
        <div className="progress-overview">
          <div className="overall-progress">
            <span>Course Progress: </span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${(currentIndex / Math.max(lectures.length, 1)) * 100}%` 
                }}
              ></div>
            </div>
            <span>{Math.round((currentIndex / Math.max(lectures.length, 1)) * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="player-content">
        {/* Video Section */}
        <div className="video-section">
          {currentLecture ? (
            <div className="video-container">
              {!isUnlocked && (
                <div className="locked-overlay">
                  <div className="locked-message">
                    <div className="lock-icon">🔒</div>
                    <h3>Lecture Locked</h3>
                    <p>Complete the previous lecture to unlock this content</p>
                    <button 
                      onClick={navigateToPrevious}
                      className="btn-primary"
                    >
                      Go to Previous Lecture
                    </button>
                  </div>
                </div>
              )}
              
              <ModernVideoPlayer
                videoURL={currentLecture.video_file}
                title={currentLecture.title}
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
              />
              
              <div className="lecture-navigation">
                <button 
                  onClick={navigateToPrevious}
                  disabled={currentIndex === 0}
                  className="nav-btn"
                >
                  ← Previous
                </button>
                
                <div className="current-lecture-info">
                  <h3>{currentLecture.title}</h3>
                  <p>{currentLecture.description}</p>
                  {userProgress[currentLecture.id]?.progress > 0 && (
                    <div className="current-progress">
                      Watched: {Math.round(userProgress[currentLecture.id].progress)}%
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={navigateToNext}
                  disabled={currentIndex === lectures.length - 1 || !isUnlocked}
                  className="nav-btn primary"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="no-lecture">
              <h3>No lectures available</h3>
              <p>This course doesn't have any video content yet.</p>
            </div>
          )}
        </div>

        {/* Lectures List */}
        <div className="lectures-sidebar">
          <div className="sidebar-header">
            <h3>Course Content</h3>
            <span>{lectures.length} parts</span>
          </div>
          
          <div className="lectures-list">
            {lectures.map((lecture, index) => {
              const { isCompleted, isCurrent, isAccessible, progress } = getLectureStatus(lecture, index);
              
              return (
                <div
                  key={lecture.id}
                  className={`lecture-item 
                    ${isCurrent ? 'active' : ''} 
                    ${isCompleted ? 'completed' : ''}
                    ${!isAccessible ? 'locked' : ''}
                  `}
                  onClick={() => isAccessible && handleLectureSelect(lecture, index)}
                >
                  <div className="lecture-status">
                    {!isAccessible ? (
                      <span className="status-icon">🔒</span>
                    ) : isCompleted ? (
                      <span className="status-icon">✅</span>
                    ) : (
                      <span className="status-icon">▶️</span>
                    )}
                  </div>
                  
                  <div className="lecture-content">
                    <div className="lecture-header">
                      <span className="part-number">Part {lecture.order}</span>
                      <h4>{lecture.title}</h4>
                    </div>
                    
                    <div className="lecture-meta">
                      <span className="duration">
                        {lecture.duration ? `${Math.floor(lecture.duration / 60)}:${(lecture.duration % 60).toString().padStart(2, '0')}` : '10:00'}
                      </span>
                      {progress > 0 && progress < 100 && (
                        <span className="progress">{Math.round(progress)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion Message */}
          {currentIndex === lectures.length - 1 && userProgress[lectures[currentIndex].id]?.watched && (
            <div className="completion-section">
              <div className="completion-message">
                <h4>🎉 Course Completed!</h4>
                <p>You've finished all video lectures!</p>
                <button 
                  onClick={() => navigate(`/exam/${courseId}`)}
                  className="btn-success"
                >
                  Take Final Exam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SequentialCoursePlayer;