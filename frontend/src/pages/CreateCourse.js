import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner',
    duration: 10,
    price: '0.00',
    is_published: false
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, token } = useAuth();
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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
      console.log('Creating course with:', formData);

      // Use JSON instead of FormData (for now, without thumbnail)
      const response = await axios.post('http://localhost:8000/api/courses/', {
        title: formData.title,
        description: formData.description,
        level: formData.level,
        duration: parseInt(formData.duration),
        price: formData.price,
        is_published: formData.is_published
      }, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Course created successfully:', response.data);
      alert('Course created successfully!');
      navigate('/my-courses');
      
    } catch (error) {
      console.error('❌ Course creation failed:', error.response?.data);
      setError('Failed to create course: ' + (error.response?.data?.error || 'Unknown error'));
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
            <small>Upload a thumbnail image for your course (optional for now)</small>
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
              name="duration"
              value={formData.duration}
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
                onChange={handleChange}
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