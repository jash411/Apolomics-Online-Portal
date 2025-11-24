import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section">
            <div className="footer-brand">
              <h3 className="footer-logo">Apolomics</h3>
              <p className="footer-tagline">
                Equipping believers with sound biblical apologetics and theological education.
              </p>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Facebook" onClick={(e) => e.preventDefault()}>
                  📘
                </a>
                <a href="#" className="social-link" aria-label="Twitter" onClick={(e) => e.preventDefault()}>
                  🐦
                </a>
                <a href="#" className="social-link" aria-label="Instagram" onClick={(e) => e.preventDefault()}>
                  📷
                </a>
                <a href="#" className="social-link" aria-label="YouTube" onClick={(e) => e.preventDefault()}>
                  📺
                </a>
                <a href="#" className="social-link" aria-label="Telegram" onClick={(e) => e.preventDefault()}>
                  ✈️
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">🏠 Home</Link></li>
              <li><Link to="/courses">📚 Courses</Link></li>
              <li><Link to="/about">ℹ️ About Us</Link></li>
              <li><Link to="/faculty">👨‍🏫 Faculty</Link></li>
              <li><Link to="/resources">📖 Resources</Link></li>
              <li><Link to="/blog">📝 Blog</Link></li>
            </ul>
          </div>

          {/* Academic Programs */}
          <div className="footer-section">
            <h4>Programs</h4>
            <ul className="footer-links">
              <li><Link to="/courses/certificate">📜 Certificate Programs</Link></li>
              <li><Link to="/courses/diploma">🎓 Diploma Programs</Link></li>
              <li><Link to="/courses/masterclass">⚡ Masterclasses</Link></li>
              <li><Link to="/courses/workshops">🔧 Workshops</Link></li>
              <li><Link to="/scholarships">💰 Scholarships</Link></li>
              <li><Link to="/admissions">📝 Admissions</Link></li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="footer-section">
            <h4>Contact Us</h4>
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">
                  📍
                </div>
                <div className="contact-text">
                  <span>Addis Ababa, Ethiopia</span>
                  <small>Mekanisa Area</small>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">
                  📞
                </div>
                <div className="contact-text">
                  <span>+251 91 561 8227</span>
                  <span>+251 93 645 3718</span>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">
                  ✉️
                </div>
                <div className="contact-text">
                  <span>apolomicsapsc@gmail.com</span>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  🕒
                </div>
                <div className="contact-text">
                  <span>Mon - Fri: 8:00 AM - 6:00 PM</span>
                  <small>Sat: 9:00 AM - 2:00 PM</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; 2024 Apolomics Apologetical School. All rights reserved.</p>
            </div>
            <div className="footer-legal">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/cookies">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;