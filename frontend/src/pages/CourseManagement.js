import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CourseManagement.css';

const CourseManagement = () => {
  const { courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [lectures, setLectures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const [courseRes, lecturesRes, assignmentsRes, examsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/courses/${courseId}/`, {
          headers: { 'Authorization': `Token ${token}` }
        }),
        fetch(`http://localhost:8000/api/video-lectures/?course_id=${courseId}`, {
          headers: { 'Authorization': `Token ${token}` }
        }),
        fetch(`http://localhost:8000/api/assignments/?course_id=${courseId}`, {
          headers: { 'Authorization': `Token ${token}` }
        }),
        fetch(`http://localhost:8000/api/exams/?course_id=${courseId}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
      ]);

      const courseData = await courseRes.json();
      const lecturesData = await lecturesRes.json();
      const assignmentsData = await assignmentsRes.json();
      const examsData = await examsRes.json();

      setCourse(courseData);
      setLectures(lecturesData);
      setAssignments(assignmentsData);
      setExams(examsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching course data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading course management...</div>;
  }

  return (
    <div className="course-management">
      <div className="management-header">
        <button onClick={() => navigate('/instructor-dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>Manage: {course?.title}</h1>
        <p>Organize your course content sequentially</p>
      </div>

      <div className="management-tabs">
        <button 
          className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          📹 Video Lectures ({lectures.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          📝 Assignments ({assignments.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          🎯 Exams ({exams.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'videos' && (
          <VideoManagement 
            courseId={courseId}
            lectures={lectures}
            onUpdate={fetchCourseData}
          />
        )}
        {activeTab === 'assignments' && (
          <AssignmentManagement 
            courseId={courseId}
            assignments={assignments}
            onUpdate={fetchCourseData}
          />
        )}
        {activeTab === 'exams' && (
          <ExamManagement 
            courseId={courseId}
            exams={exams}
            onUpdate={fetchCourseData}
          />
        )}
      </div>
    </div>
  );
};

// Video Management Component
const VideoManagement = ({ courseId, lectures, onUpdate }) => {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: lectures.length + 1,
    duration: 0
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const submitData = new FormData();
      submitData.append('course', courseId);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('order', formData.order);
      submitData.append('duration', formData.duration);
      submitData.append('video_file', videoFile);

      const response = await fetch('http://localhost:8000/api/video-lectures/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: submitData
      });

      if (response.ok) {
        alert('Video lecture added successfully!');
        setShowForm(false);
        setFormData({ title: '', description: '', order: lectures.length + 2, duration: 0 });
        setVideoFile(null);
        onUpdate();
      } else {
        alert('Error adding video lecture');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding video lecture');
    } finally {
      setUploading(false);
    }
  };

  const reorderLectures = async (lectureId, newOrder) => {
    try {
      await fetch(`http://localhost:8000/api/video-lectures/${lectureId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ order: newOrder })
      });
      onUpdate();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  return (
    <div className="video-management">
      <div className="section-header">
        <h3>Course Video Lectures</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          + Add Video Lecture
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="video-form">
          <div className="form-row">
            <div className="form-group">
              <label>Lecture Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                placeholder="e.g., Introduction to Apologetics"
              />
            </div>
            <div className="form-group">
              <label>Order *</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              placeholder="Describe what this video covers..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (seconds)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Video File *</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? 'Uploading...' : 'Add Video Lecture'}
            </button>
          </div>
        </form>
      )}

      <div className="lectures-list">
        {lectures.sort((a, b) => a.order - b.order).map((lecture, index) => (
          <div key={lecture.id} className="lecture-item">
            <div className="lecture-header">
              <div className="lecture-info">
                <span className="lecture-number">Part {lecture.order}</span>
                <h4>{lecture.title}</h4>
                <span className="lecture-duration">
                  {Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="lecture-actions">
                <button 
                  onClick={() => reorderLectures(lecture.id, lecture.order - 1)}
                  disabled={lecture.order === 1}
                  className="btn-outline"
                >
                  ↑
                </button>
                <button 
                  onClick={() => reorderLectures(lecture.id, lecture.order + 1)}
                  disabled={lecture.order === lectures.length}
                  className="btn-outline"
                >
                  ↓
                </button>
                <button className="btn-danger">Delete</button>
              </div>
            </div>
            <p className="lecture-description">{lecture.description}</p>
          </div>
        ))}

        {lectures.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📹</div>
            <p>No video lectures yet</p>
            <p>Add your first video lecture to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Assignment Management Component
const AssignmentManagement = ({ courseId, assignments, onUpdate }) => {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    max_score: 100,
    due_date: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8000/api/assignments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          ...formData,
          course: courseId,
          due_date: formData.due_date || null
        })
      });

      if (response.ok) {
        alert('Assignment created successfully!');
        setShowForm(false);
        setFormData({ title: '', description: '', max_score: 100, due_date: '' });
        onUpdate();
      } else {
        alert('Error creating assignment');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating assignment');
    }
  };

  return (
    <div className="assignment-management">
      <div className="section-header">
        <h3>Course Assignments</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Add Assignment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="assignment-form">
          <div className="form-group">
            <label>Assignment Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              placeholder="e.g., Research Paper on Biblical Apologetics"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="4"
              required
              placeholder="Describe the assignment requirements..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Maximum Score</label>
              <input
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData({...formData, max_score: parseInt(e.target.value)})}
                min="1"
                max="1000"
              />
            </div>
            <div className="form-group">
              <label>Due Date (Optional)</label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Assignment
            </button>
          </div>
        </form>
      )}

      <div className="assignments-list">
        {assignments.map(assignment => (
          <div key={assignment.id} className="assignment-item">
            <h4>{assignment.title}</h4>
            <p>{assignment.description}</p>
            <div className="assignment-meta">
              <span>Max Score: {assignment.max_score}</span>
              {assignment.due_date && (
                <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        ))}

        {assignments.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No assignments yet</p>
            <p>Add assignments to test student understanding</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Exam Management Component (Simplified - you can expand this)
const ExamManagement = ({ courseId, exams, onUpdate }) => {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="exam-management">
      <div className="section-header">
        <h3>Course Exams</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Create Exam
        </button>
      </div>

      {/* Add exam creation form here */}
      
      <div className="exams-list">
        {exams.map(exam => (
          <div key={exam.id} className="exam-item">
            <h4>{exam.title}</h4>
            <p>{exam.description}</p>
            <div className="exam-meta">
              <span>Duration: {exam.duration}min</span>
              <span>Passing: {exam.passing_score}%</span>
              <span>Questions: {exam.questions?.length || 0}</span>
            </div>
            <div className="exam-actions">
              <button className="btn-outline">Manage Questions</button>
              <button className="btn-primary">Edit Exam</button>
            </div>
          </div>
        ))}

        {exams.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>No exams yet</p>
            <p>Create exams to evaluate student learning</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;