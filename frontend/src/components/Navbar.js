import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Apolomics School
        </Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses">Courses</Link></li>
          
          {user ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              
              {/* Instructor-specific links */}
              {user.user_type === 'instructor' && (
                <li><Link to="/courses/create">Create Course</Link></li>
              )}
              
              {/* Student-specific links */}
              {user.user_type === 'student' && (
                <li><Link to="/my-courses">My Learning</Link></li>
              )}
              
              <li>
                <button 
                  onClick={handleLogout}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'white', 
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Logout ({user.username} - {user.user_type})
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;