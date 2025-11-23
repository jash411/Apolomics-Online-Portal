import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="container">
        <h1>Dashboard</h1>
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Welcome, {user.first_name || user.username}!</h1>
      <p><strong>Role:</strong> {user.user_type}</p>
      
      {user.user_type === 'instructor' ? (
        <InstructorDashboard user={user} />
      ) : (
        <StudentDashboard user={user} />
      )}
      
      <button onClick={logout} className="btn btn-primary" style={{ marginTop: '15px' }}>
        Logout
      </button>
    </div>
  );
};

// Instructor-specific dashboard
const InstructorDashboard = ({ user }) => {
  return (
    <div>
      <div className="card">
        <h3>Instructor Dashboard</h3>
        <p>Manage your courses and track student progress.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div className="course-card">
            <h4>Create New Course</h4>
            <p>Design and publish a new course for students.</p>
            <Link to="/courses/create" className="btn btn-primary">
              Create Course
            </Link>
          </div>
          
          <div className="course-card">
            <h4>My Courses</h4>
            <p>View and manage your existing courses.</p>
            {/* FIXED: Changed to "/my-courses" */}
            <Link to="/my-courses" className="btn btn-primary">
              View My Courses
            </Link>
          </div>
          
          <div className="course-card">
            <h4>Student Progress</h4>
            <p>Monitor how students are progressing in your courses.</p>
            <Link to="/analytics" className="btn btn-primary">
              View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Student-specific dashboard
const StudentDashboard = ({ user }) => {
  return (
    <div>
      <div className="card">
        <h3>Student Dashboard</h3>
        <p>Continue your learning journey and track your progress.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div className="course-card">
            <h4>My Courses</h4>
            <p>Continue learning from your enrolled courses.</p>
            {/* FIXED: Added slash to make it "/my-courses" */}
            <Link to="/my-courses" className="btn btn-primary">
              View My Courses
            </Link>
          </div>
          
          <div className="course-card">
            <h4>Browse Courses</h4>
            <p>Discover new courses to enroll in.</p>
            <Link to="/courses" className="btn btn-primary">
              Browse All Courses
            </Link>
          </div>
          
          <div className="course-card">
            <h4>My Certificates</h4>
            <p>View your earned certificates.</p>
            <Link to="/certificates" className="btn btn-primary">
              View Certificates
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;