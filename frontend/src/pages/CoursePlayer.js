import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course details
        const courseResponse = await axios.get(`http://localhost:8000/api/courses/${courseId}/`);
        setCourse(courseResponse.data);

        // Fetch videos for this course
        const videosResponse = await axios.get('http://localhost:8000/api/video-lectures/');
        const courseVideos = videosResponse.data.filter(video => video.course === parseInt(courseId));
        setVideos(courseVideos);
        
        if (courseVideos.length > 0) {
          setCurrentVideo(courseVideos[0]);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const markAsWatched = async (videoId) => {
    try {
      await axios.post('http://localhost:8000/api/student-progress/mark_watched/', {
        video_id: videoId
      });
      alert('Marked as watched!');
    } catch (error) {
      console.error('Error marking as watched:', error);
    }
  };

  // Function to get full video URL
  const getVideoUrl = (videoPath) => {
    if (!videoPath) return null;
    // If it's already a full URL, return as is
    if (videoPath.startsWith('http')) return videoPath;
    // Otherwise, construct the full URL
    return `http://localhost:8000${videoPath}`;
  };

  // Function to get full thumbnail URL
  const getThumbnailUrl = (thumbnailPath) => {
    if (!thumbnailPath) return null;
    // If it's already a full URL, return as is
    if (thumbnailPath.startsWith('http')) return thumbnailPath;
    // Otherwise, construct the full URL
    return `http://localhost:8000${thumbnailPath}`;
  };

  if (loading) {
    return (
      <div className="container">
        <p>Loading course content...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container">
        <h1>Course not found</h1>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="course-player">
        <div className="player-header">
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>

        <div className="player-layout">
          <div className="video-section">
            {currentVideo ? (
              <div className="video-player">
                <h3>{currentVideo.title}</h3>
                {currentVideo.video_file ? (
                  <div className="video-container">
                    <video 
                      controls 
                      style={{ width: '100%', maxHeight: '500px' }}
                      onEnded={() => markAsWatched(currentVideo.id)}
                      poster={getThumbnailUrl(course.thumbnail)}
                    >
                      <source src={getVideoUrl(currentVideo.video_file)} type="video/mp4" />
                      <source src={getVideoUrl(currentVideo.video_file)} type="video/webm" />
                      <source src={getVideoUrl(currentVideo.video_file)} type="video/ogg" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="video-fallback">
                      <p>If the video doesn't play, try:</p>
                      <a href={getVideoUrl(currentVideo.video_file)} target="_blank" rel="noopener noreferrer">
                        Download the video
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="video-placeholder">
                    <p>Video file not available</p>
                  </div>
                )}
                <p>{currentVideo.description}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => markAsWatched(currentVideo.id)}
                >
                  Mark as Watched
                </button>
              </div>
            ) : (
              <div className="no-video">
                <h3>No videos available for this course</h3>
                <p>Check back later for video content.</p>
              </div>
            )}
          </div>

          <div className="playlist-section">
            <h3>Course Content ({videos.length} videos)</h3>
            <div className="video-list">
              {videos.map(video => (
                <div 
                  key={video.id} 
                  className={`video-item ${currentVideo?.id === video.id ? 'active' : ''}`}
                  onClick={() => setCurrentVideo(video)}
                >
                  <div className="video-thumbnail">
                    {course.thumbnail ? (
                      <img 
                        src={getThumbnailUrl(course.thumbnail)} 
                        alt={video.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div className="thumbnail-fallback" style={{display: course.thumbnail ? 'none' : 'block'}}>
                      🎬
                    </div>
                  </div>
                  <div className="video-info">
                    <h4>{video.title}</h4>
                    <p>{video.duration_minutes} min</p>
                    <p className="video-order">Video {video.order}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;