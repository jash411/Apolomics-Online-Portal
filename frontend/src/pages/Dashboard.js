import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="container dashboard-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>Authentication Required</h3>
          <p>Please log in to access your personalized dashboard</p>
          <Link to="/login" className="btn btn-primary">
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user.first_name || user.username}! 👋</h1>
        <p>Continue your learning journey with Apolomics</p>
        <span className="role-badge-large">
          {user.user_type === 'instructor' ? '🎓 Instructor' : '📚 Student'}
        </span>
      </div>
      
      {user.user_type === 'instructor' ? (
        <InstructorDashboard user={user} />
      ) : (
        <StudentDashboard user={user} />
      )}
      
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <button onClick={logout} className="btn btn-outline">
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

const InstructorDashboard = ({ user }) => {
  return (
    <div className="fade-in-up">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">12</div>
          <div className="stat-label">Total Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">1.2K</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">98%</div>
          <div className="stat-label">Satisfaction</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">4.8</div>
          <div className="stat-label">Avg Rating</div>
        </div>
      </div>

      <div className="dashboard-grid-enhanced">
        <div className="dashboard-card-enhanced">
          <span className="dashboard-card-icon">🎨</span>
          <h4>Create New Course</h4>
          <p>Design and publish a new apologetics course for your students</p>
          <Link to="/courses/create" className="btn btn-primary">
            Start Creating
          </Link>
        </div>
        
        <div className="dashboard-card-enhanced">
          <span className="dashboard-card-icon">📚</span>
          <h4>My Courses</h4>
          <p>Manage your existing courses and update content</p>
          <Link to="/my-courses" className="btn btn-secondary">
            View Courses
          </Link>
        </div>
        
        <div className="dashboard-card-enhanced">
          <span className="dashboard-card-icon">📊</span>
          <h4>Student Analytics</h4>
          <p>Track student progress and engagement metrics</p>
          <Link to="/analytics" className="btn btn-outline">
            View Analytics
          </Link>
        </div>

        <div className="dashboard-card-enhanced">
          <span className="dashboard-card-icon">💬</span>
          <h4>Student Discussions</h4>
          <p>Engage with students and answer their questions</p>
          <Link to="/discussions" className="btn btn-outline">
            Join Discussions
          </Link>
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = ({ user }) => {
  return (
    <div className="fade-in-up">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">5</div>
          <div className="stat-label">Enrolled Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">12</div>
          <div className="stat-label">Hours Learned</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">3</div>
          <div className="stat-label">Certificates</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">85%</div>
          <div className="stat-label">Avg Progress</div>
        </div>
      </div>

      <div className="dashboard-grid-enhanced">
        <div className="dashboard-card-enhanced">
          <span className="dashboard-card-icon">🎯</span>
          <h4>Continue Learning</h4>
          <p>Pick up where you left off in your enrolled courses</p>
          <Link to="/my-courses" className="btn btn-primary">
            My Courses
          </Link>
        </div>
        
        <div className="dashboard-card-enhanced">
          <span className="dashboard-card-icon">🔍</span>
          <h4>Browse Courses</h4>
          <p>Discover new apologetics courses to expand your knowledge</p>
          <Link to="/courses" className="btn btn-secondary">
            Explore Courses
          </Link>
        </div>
        
        <div className="dashboard-card-enhanced">
          <span className="dashboard-card-icon">🏆</span>
          <h4>My Certificates</h4>
          <p>View and download your earned certificates</p>
          <Link to="/certificates" className="btn btn-outline">
            View Certificates
          </Link>
        </div>

        <div className="dashboard-card-enhanced">
          <span className="dashboard-card-icon">📖</span>
          <h4>Study Resources</h4>
          <p>Access additional learning materials and resources</p>
          <Link to="/resources" className="btn btn-outline">
            View Resources
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;