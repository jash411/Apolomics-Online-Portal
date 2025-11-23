import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner',
    duration_hours: 10,
    price: 0,
    is_published: false
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.user_type !== 'instructor') {
    return (
      <div className="container">
        <h1>Access Denied</h1>
        <p>Only instructors can create courses.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleThumbnailChange = (e) => {
    setThumbnail(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData to handle file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('level', formData.level);
      submitData.append('duration_hours', formData.duration_hours);
      submitData.append('price', formData.price);
      submitData.append('is_published', formData.is_published);
      
      if (thumbnail) {
        submitData.append('thumbnail', thumbnail);
      }

      // Remove unused response variable by not assigning it
      await axios.post('http://localhost:8000/api/courses/', submitData, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Course created successfully!');
      navigate('/my-courses');
    } catch (error) {
      console.error('Create course error:', error);
      setError(error.response?.data?.error || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Create New Course</h1>
      
      <div className="card">
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course Title:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Introduction to Apologetics"
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Describe what students will learn..."
            />
          </div>

          <div className="form-group">
            <label>Course Thumbnail:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            <small>Upload a thumbnail image for your course</small>
          </div>

          <div className="form-group">
            <label>Level:</label>
            <select name="level" value={formData.level} onChange={handleChange}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group">
            <label>Duration (hours):</label>
            <input
              type="number"
              name="duration_hours"
              value={formData.duration_hours}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Price ($):</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
              />
              Publish Course
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating Course...' : 'Create Course'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;