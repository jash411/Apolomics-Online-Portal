import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <h1>Welcome to Apolomics Apologetical School</h1>
        <p style={{ fontSize: '1.2rem', color: '#7f8c8d', margin: '20px 0' }}>
          Your online platform for theological education and certification
        </p>
        <div style={{ marginTop: '30px' }}>
          <Link to="/courses" className="btn btn-primary" style={{ marginRight: '10px' }}>
            Browse Courses
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;