import React, { useRef } from 'react';

const ModernVideoPlayer = ({ videoURL, title }) => {
  const videoRef = useRef(null);

  const getFixedVideoUrl = () => {
    if (!videoURL || videoURL === 'undefined' || videoURL === 'null') {
      return '';
    }

    if (videoURL.startsWith('http://') || videoURL.startsWith('https://')) {
      return videoURL;
    }
    
    if (videoURL.startsWith('/media/')) {
      return `http://localhost:8000${videoURL}`;
    }

    if (!videoURL.includes('/')) {
      return `http://localhost:8000/media/video_lectures/${videoURL}`;
    }

    return videoURL;
  };

  const fixedVideoUrl = getFixedVideoUrl();

  if (!fixedVideoUrl) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#fed7d7',
        color: '#c53030',
        borderRadius: '8px'
      }}>
        <h3>No Video Available</h3>
        <p>The video URL is missing or invalid.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '800px', 
      margin: '0 auto',
      backgroundColor: '#000',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Video Title */}
      {title && (
        <div style={{ 
          padding: '15px 20px',
          backgroundColor: '#2d3748',
          color: 'white',
          borderBottom: '1px solid #4a5568'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{title}</h3>
        </div>
      )}

      {/* Video Element with Browser's Default Controls */}
      <video
        ref={videoRef}
        controls
        src={fixedVideoUrl}
        style={{ 
          width: '100%',
          display: 'block'
        }}
        preload="metadata"
        playsInline
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default ModernVideoPlayer;