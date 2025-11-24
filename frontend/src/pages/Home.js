import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import logo from './logo.png';

const Home = () => {
  const [news, setNews] = useState([]);
  const [academicPrograms, setAcademicPrograms] = useState([]);

  useEffect(() => {
    setNews([
      {
        id: 1,
        title: 'New Apologetics Course Launched',
        date: '2024-01-15',
        excerpt: 'We are excited to announce our new advanced apologetics course starting next month.',
        image: '/images/news1.jpg'
      },
      {
        id: 2,
        title: 'Guest Lecturer: Dr. John Smith',
        date: '2024-01-10',
        excerpt: 'Join us for a special lecture series by renowned theologian Dr. John Smith.',
        image: '/images/news2.jpg'
      },
      {
        id: 3,
        title: 'Scholarship Applications Open',
        date: '2024-01-05',
        excerpt: 'Apply now for our annual scholarship program for deserving students.',
        image: '/images/news3.jpg'
      }
    ]);

    setAcademicPrograms([
      {
        id: 1,
        title: 'Certificate in Biblical Apologetics',
        duration: '6 Months',
        level: 'Beginner',
        description: 'Foundational course in biblical defense and evidence-based faith.',
        icon: '📖'
      },
      {
        id: 2,
        title: 'Diploma in Theological Studies',
        duration: '1 Year',
        level: 'Intermediate',
        description: 'Comprehensive study of systematic theology and church history.',
        icon: '🎓'
      },
      {
        id: 3,
        title: 'Advanced Apologetics Masterclass',
        duration: '3 Months',
        level: 'Advanced',
        description: 'Specialized training in contemporary apologetic challenges.',
        icon: '⚡'
      }
    ]);
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Welcome to <span className="highlight">Apolomics</span> Apologetical School
            </h1>
            <p className="hero-subtitle">
              Your premier online platform for theological education, certification, 
              and spiritual growth in Christian apologetics
            </p>
            <div className="hero-buttons">
              <Link to="/courses" className="btn btn-primary">
                Explore Courses
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Start Learning
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Students Enrolled</span>
              </div>
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">Courses Available</span>
              </div>
              <div className="stat">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfaction Rate</span>
              </div>
            </div>
          </div>
          

{/* <div className="hero-image">
            <div className="floating-card">
              <div className="card-content">
                <h3>Ready to Defend Your Faith?</h3>
                <p>Join thousands of students learning to articulate and defend Christian truth claims</p>
              </div>
            </div>
          </div> */}


<div className="hero-image">
  <div className="floating-card">
    <div className="card-content">
        <h3>Ready to Defend Your Faith?</h3>
        <p>Join thousands of students learning to articulate and defend Christian truth claims</p>
      </div>
      <div className="hero-logo-container">
        <img src={logo} alt="Apolomics Logo" className="hero-logo" />
      </div>
    </div>
  </div>


        </div>
      </section>

      {/* Academic Programs Section */}
      <section className="academic-section">
        <div className="container">
          <div className="section-header">
            <h2>Academic Programs</h2>
            <p>Comprehensive theological education designed for modern believers</p>
          </div>
          <div className="programs-grid">
            {academicPrograms.map(program => (
              <div key={program.id} className="program-card">
                <div className="program-icon">{program.icon}</div>
                <h3>{program.title}</h3>
                <div className="program-meta">
                  <span className="duration">{program.duration}</span>
                  <span className="level">{program.level}</span>
                </div>
                <p>{program.description}</p>
                <Link to={`/programs/${program.id}`} className="program-link">
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/academics" className="btn btn-outline">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="news-section">
        <div className="container">
          <div className="section-header">
            <h2>Latest News & Updates</h2>
            <p>Stay informed about our latest courses, events, and announcements</p>
          </div>
          <div className="news-grid">
            {news.map(item => (
              <article key={item.id} className="news-card">
                <div className="news-image">
                  <img src={item.image} alt={item.title} />
                  <div className="news-date">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="news-content">
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  <Link to={`/news/${item.id}`} className="read-more">
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/news" className="btn btn-outline">
              View All News
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3>Expert Instructors</h3>
              <p>Learn from seasoned theologians and experienced apologists</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📱</div>
              <h3>Flexible Learning</h3>
              <p>Study at your own pace with our online platform</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🏆</div>
              <h3>Certification</h3>
              <p>Earn recognized certificates upon completion</p>
            </div>
            <div className="feature">
              <div className="feature-icon">👥</div>
              <h3>Community</h3>
              <p>Join a vibrant community of like-minded believers</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;