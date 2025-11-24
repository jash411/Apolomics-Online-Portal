import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from './logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getUserInitial = () => {
    if (user?.first_name) return user.first_name[0].toUpperCase();
    if (user?.username) return user.username[0].toUpperCase();
    return 'U';
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo and Brand Name */}
        <div className="navbar-brand-container">
          <Link to="/" className="navbar-brand">
            <img src={logo} alt="Apolomics Logo" className="navbar-logo" />
            <span className="brand-text">Apolomics Apologetical School</span>
          </Link>
        </div>
        
        <ul className="navbar-nav">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              🏠 Home
            </Link>
          </li>
          <li>
            <Link to="/courses" className={location.pathname === '/courses' ? 'active' : ''}>
              📚 Courses
            </Link>
          </li>
          {user && (
            <>
              <li>
                <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
                  📊 Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-courses" className={location.pathname === '/my-courses' ? 'active' : ''}>
                  🎓 My Learning
                </Link>
              </li>
              {user.user_type === 'instructor' && (
                <li>
                  <Link to="/courses/create" className={location.pathname === '/courses/create' ? 'active' : ''}>
                    ➕ Create Course
                  </Link>
                </li>
              )}
            </>
          )}
        </ul>

        <div className="navbar-actions">
          {user ? (
            <>
              <div className="user-welcome">
                <div className="user-avatar">
                  {getUserInitial()}
                </div>
                <span>Hi, {user.first_name || user.username}</span>
              </div>
              <button onClick={logout} className="btn btn-secondary">
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                🔐 Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                ✨ Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;