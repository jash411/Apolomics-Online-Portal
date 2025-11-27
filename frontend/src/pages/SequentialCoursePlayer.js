import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ModernVideoPlayer from '../components/ModernVideoPlayer';
import './SequentialCoursePlayer.css';
import { filterByCurrentUser } from '../utils/securityFilter';

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
  const [assignmentStatus, setAssignmentStatus] = useState(null);
  const [assignment, setAssignment] = useState(null);

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
        const allProgressData = await progressResponse.json();
        
        // USE SECURITY FILTER
        const myProgressData = filterByCurrentUser(allProgressData, user, 'progress');
        
        console.log('✅ Secure progress data:', myProgressData.length, 'records');
        
        myProgressData.forEach(progress => {
          progressMap[progress.video_lecture] = progress;
        });
      }
      setUserProgress(progressMap);

      // Fetch assignment and submission status
      await fetchAssignmentStatus();

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
  }, [courseId, token, user]);

  // Function to fetch assignment status
  const fetchAssignmentStatus = async () => {
    try {
      // Fetch assignment for this course
      const assignmentResponse = await fetch(`http://localhost:8000/api/assignments/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (assignmentResponse.ok) {
        const assignments = await assignmentResponse.json();
        if (assignments.length > 0) {
          const currentAssignment = assignments[0];
          setAssignment(currentAssignment);
          
          // Check if user has submitted this assignment
          const submissionResponse = await fetch(`http://localhost:8000/api/assignment-submissions/?assignment=${currentAssignment.id}`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          if (submissionResponse.ok) {
            const submissions = await submissionResponse.json();
            if (submissions.length > 0) {
              setAssignmentStatus(submissions[0]);
            } else {
              setAssignmentStatus('not_submitted');
            }
          }
        } else {
          setAssignmentStatus('no_assignment');
        }
      }
    } catch (error) {
      console.error('Error fetching assignment status:', error);
      setAssignmentStatus('error');
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // Effect to periodically check assignment status when videos are completed
  useEffect(() => {
    if (currentIndex === lectures.length - 1 && userProgress[lectures[currentIndex].id]?.watched) {
      // If all videos are completed, check assignment status every 10 seconds
      const interval = setInterval(() => {
        if (assignmentStatus && assignmentStatus.status === 'submitted') {
          console.log('🔄 Checking for assignment status update...');
          fetchAssignmentStatus();
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [currentIndex, lectures, userProgress, assignmentStatus, fetchAssignmentStatus]);

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
    if (currentLecture && progressPercent % 25 === 0) {
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
    if (index === 0) {
      return true;
    }
    
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
      setIsUnlocked(true);
    }
  };

  const getLectureStatus = (lecture, index) => {
    const progress = userProgress[lecture.id];
    const isCompleted = progress?.watched;
    const isCurrent = index === currentIndex;
    const isAccessible = checkIfLectureAccessible(lecture, index);
    
    return { isCompleted, isCurrent, isAccessible, progress: progress?.progress || 0 };
  };

  // Function to render assignment status and next steps
  const renderAssignmentStatus = () => {
    if (!assignment) {
      return (
        <div className="assignment-status">
          <span className="status-icon">📝</span>
          <span>Assignment: No assignment available</span>
        </div>
      );
    }

    if (assignmentStatus === 'not_submitted' || !assignmentStatus) {
      return (
        <div className="assignment-status pending">
          <span className="status-icon">📝</span>
          <span>Assignment: Not Submitted</span>
        </div>
      );
    }

    if (assignmentStatus.status === 'submitted' || assignmentStatus.status === 'under_review') {
      return (
        <div className="assignment-status under-review">
          <span className="status-icon">⏳</span>
          <span>Assignment: Under Review</span>
          {assignmentStatus.score && (
            <span className="score">Score: {assignmentStatus.score}/{assignment.max_score}</span>
          )}
        </div>
      );
    }

    if (assignmentStatus.status === 'approved') {
      return (
        <div className="assignment-status approved">
          <span className="status-icon">✅</span>
          <span>Assignment: Approved</span>
          {assignmentStatus.score && (
            <span className="score">Score: {assignmentStatus.score}/{assignment.max_score}</span>
          )}
        </div>
      );
    }

    if (assignmentStatus.status === 'rejected') {
      return (
        <div className="assignment-status rejected">
          <span className="status-icon">❌</span>
          <span>Assignment: Needs Revision</span>
        </div>
      );
    }

    return null;
  };

  // Function to render the main action button
  const renderMainActionButton = () => {
    if (!assignment) {
      return null;
    }

    if (assignmentStatus === 'not_submitted' || !assignmentStatus) {
      return (
        <button 
          onClick={() => navigate(`/assignment/${courseId}`)}
          className="btn-primary large"
        >
          📝 Submit Assignment
        </button>
      );
    }

    if (assignmentStatus.status === 'submitted' || assignmentStatus.status === 'under_review') {
      return (
        <button 
          onClick={() => navigate(`/assignment/${courseId}`)}
          className="btn-outline large"
        >
          ⏳ Assignment Under Review
        </button>
      );
    }

    if (assignmentStatus.status === 'approved') {
      return (
        <button 
          onClick={() => navigate(`/exam/${courseId}`)}
          className="btn-success large"
        >
          🎯 Take Final Exam
        </button>
      );
    }

    if (assignmentStatus.status === 'rejected') {
      return (
        <button 
          onClick={() => navigate(`/assignment/${courseId}`)}
          className="btn-primary large"
        >
          🔄 Resubmit Assignment
        </button>
      );
    }

    return null;
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
                <h4>🎉 All Videos Completed!</h4>
                <p>You've successfully finished all {lectures.length} video lectures!</p>
                
                <div className="next-steps-buttons">
                  {renderMainActionButton()}
                  <p className="next-steps-info">
                    {assignmentStatus?.status === 'approved' 
                      ? 'Your assignment is approved! Take the final exam to complete the course.'
                      : assignmentStatus?.status === 'rejected'
                      ? 'Please resubmit your assignment with improvements.'
                      : assignmentStatus?.status === 'submitted' || assignmentStatus?.status === 'under_review'
                      ? 'Your assignment is under review. You\'ll be notified when it\'s approved.'
                      : 'Complete the assignment to proceed to the final exam'
                    }
                  </p>
                </div>

                <CourseCompletionStatus 
                  courseId={courseId} 
                  lectures={lectures}
                  userProgress={userProgress}
                  assignmentStatus={assignmentStatus}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// NEW COMPONENT: Course Completion Status
const CourseCompletionStatus = ({ courseId, lectures, userProgress, assignmentStatus }) => {
  const { user, token } = useAuth();
  const [examStatus, setExamStatus] = useState(null);
  const [certificateStatus, setCertificateStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletionStatus();
  }, [courseId, token, user]);

  const fetchCompletionStatus = async () => {
    try {
      // Fetch exam submissions
      const examsResponse = await fetch(`http://localhost:8000/api/exams/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      // Fetch exam submissions for this user
      const examSubmissionsResponse = await fetch(`http://localhost:8000/api/exam-submissions/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      // Fetch certificates
      const certificatesResponse = await fetch(`http://localhost:8000/api/certificates/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const [examsData, examSubmissionsData, certificatesData] = await Promise.all([
        examsResponse.ok ? examsResponse.json() : [],
        examSubmissionsResponse.ok ? examSubmissionsResponse.json() : [],
        certificatesResponse.ok ? certificatesResponse.json() : []
      ]);

      console.log('📊 Completion Status Data:', {
        exams: examsData,
        examSubmissions: examSubmissionsData,
        certificates: certificatesData
      });

      // Check exam status
      let examTaken = false;
      let examScore = null;
      let examPassed = false;
      
      if (examsData.length > 0) {
        const exam = examsData[0];
        const myExamSubmission = examSubmissionsData.find(sub => 
          sub.exam === exam.id && sub.student === user.id
        );
        
        if (myExamSubmission) {
          examTaken = true;
          examScore = myExamSubmission.score;
          examPassed = myExamSubmission.passed;
        }
      }

      // Check certificate status
      const certificateIssued = certificatesData.length > 0;

      setExamStatus({
        taken: examTaken,
        score: examScore,
        passed: examPassed,
        available: assignmentStatus?.status === 'approved' && !examTaken
      });

      setCertificateStatus({
        issued: certificateIssued,
        available: examPassed
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching completion status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="progress-summary">
        <h5>Loading your progress...</h5>
      </div>
    );
  }

  return (
    <div className="progress-summary">
      <h5>Your Progress:</h5>
      <div className="progress-items">
        {/* Video Lectures Status */}
        <div className="progress-item completed">
          <span className="status-icon">✅</span>
          <span>Video Lectures: {lectures.filter(lecture => userProgress[lecture.id]?.watched).length}/{lectures.length}</span>
        </div>
        
        {/* Assignment Status */}
        <div className={`progress-item ${
          assignmentStatus?.status === 'approved' ? 'completed' :
          assignmentStatus?.status === 'rejected' ? 'rejected' :
          assignmentStatus?.status === 'submitted' || assignmentStatus?.status === 'under_review' ? 'under-review' : 'pending'
        }`}>
          <span className="status-icon">
            {assignmentStatus?.status === 'approved' ? '✅' :
             assignmentStatus?.status === 'rejected' ? '❌' :
             assignmentStatus?.status === 'submitted' || assignmentStatus?.status === 'under_review' ? '⏳' : '📝'}
          </span>
          <span>
            Assignment: {
              assignmentStatus?.status === 'approved' ? 'Approved' :
              assignmentStatus?.status === 'rejected' ? 'Needs Revision' :
              assignmentStatus?.status === 'submitted' || assignmentStatus?.status === 'under_review' ? 'Under Review' : 'Not Submitted'
            }
          </span>
          {assignmentStatus?.score && (
            <span className="score">Score: {assignmentStatus.score}</span>
          )}
        </div>
        
        {/* Final Exam Status */}
        <div className={`progress-item ${
          examStatus?.taken ? (examStatus.passed ? 'completed' : 'failed') :
          examStatus?.available ? 'available' : 'locked'
        }`}>
          <span className="status-icon">
            {examStatus?.taken ? (examStatus.passed ? '✅' : '❌') :
             examStatus?.available ? '🎯' : '🔒'}
          </span>
          <span>
            Final Exam: {
              examStatus?.taken ? (examStatus.passed ? `Passed (${examStatus.score}%)` : `Failed (${examStatus.score}%)`) :
              examStatus?.available ? 'Available' : 'Locked'
            }
          </span>
        </div>
        
        {/* Certificate Status */}
        <div className={`progress-item ${
          certificateStatus?.issued ? 'completed' :
          certificateStatus?.available ? 'available' : 'locked'
        }`}>
          <span className="status-icon">
            {certificateStatus?.issued ? '🏆' :
             certificateStatus?.available ? '✅' : '🔒'}
          </span>
          <span>
            Certificate: {
              certificateStatus?.issued ? 'Issued' :
              certificateStatus?.available ? 'Available' : 'Locked'
            }
          </span>
        </div>
      </div>

      {/* Certificate Download Button */}
      {certificateStatus?.issued && (
        <div className="certificate-action">
          <button 
            onClick={() => window.location.href = `/certificate/${courseId}`}
            className="btn-success"
          >
            🏆 Download Certificate
          </button>
        </div>
      )}
    </div>
  );
};

export default SequentialCoursePlayer;