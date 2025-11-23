import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const InstructorDashboard = () => {
  const [myCourses, setMyCourses] = useState([]);
  const [courseStats, setCourseStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        // Fetch instructor's courses
        const coursesResponse = await axios.get('http://localhost:8000/api/courses/my_courses/');
        setMyCourses(coursesResponse.data);

        // Fetch enrollment stats for each course
        const stats = {};
        for (const course of coursesResponse.data) {
          try {
            const enrollmentsResponse = await axios.get('http://localhost:8000/api/enrollments/');
            const courseEnrollments = enrollmentsResponse.data.filter(e => e.course === course.id);
            stats[course.id] = {
              totalEnrollments: courseEnrollments.length,
              completedEnrollments: courseEnrollments.filter(e => e.completed).length
            };
          } catch (error) {
            console.error(`Error fetching stats for course ${course.id}:`, error);
            stats[course.id] = { totalEnrollments: 0, completedEnrollments: 0 };
          }
        }
        setCourseStats(stats);
      } catch (error) {
        console.error('Error fetching instructor data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchInstructorData();
    }
  }, [user]);

  const getCourseRevenue = (course) => {
    const stats = courseStats[course.id];
    return stats ? stats.totalEnrollments * course.price : 0;
  };

  if (loading) {
    return (
      <div className="container">
        <h1>Instructor Dashboard</h1>
        <p>Loading your teaching analytics...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome, Professor {user?.last_name || 'Instructor'}! 🎓</h1>
        <p>Manage your courses and track student progress</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p className="stat-number">{myCourses.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">
            {Object.values(courseStats).reduce((acc, stat) => acc + stat.totalEnrollments, 0)}
          </p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-number">
            ${myCourses.reduce((acc, course) => acc + getCourseRevenue(course), 0).toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <h3>Course Completions</h3>
          <p className="stat-number">
            {Object.values(courseStats).reduce((acc, stat) => acc + stat.completedEnrollments, 0)}
          </p>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Your Courses ({myCourses.length})</h2>
          <Link to="/courses/create" className="btn btn-primary">
            Create New Course
          </Link>
        </div>
        
        {myCourses.length === 0 ? (
          <div className="empty-state">
            <h3>No courses created yet</h3>
            <p>Start sharing your knowledge by creating your first course</p>
            <Link to="/courses/create" className="btn btn-primary">
              Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="courses-grid">
            {myCourses.map(course => (
              <div key={course.id} className="course-card instructor-card">
                {course.thumbnail && (
                  <img 
                    src={`http://localhost:8000${course.thumbnail}`} 
                    alt={course.title}
                    className="course-thumbnail"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                
                <div className="course-stats">
                  <div className="stat">
                    <strong>Enrollments:</strong> {courseStats[course.id]?.totalEnrollments || 0}
                  </div>
                  <div className="stat">
                    <strong>Completed:</strong> {courseStats[course.id]?.completedEnrollments || 0}
                  </div>
                  <div className="stat">
                    <strong>Revenue:</strong> ${getCourseRevenue(course).toFixed(2)}
                  </div>
                  <div className="stat">
                    <strong>Status:</strong> {course.is_published ? 'Published' : 'Draft'}
                  </div>
                </div>

                <div className="card-actions">
                  <Link to={`/learn/${course.id}`} className="btn btn-secondary">
                    View Course
                  </Link>
                  <Link to={`/courses/${course.id}/manage`} className="btn btn-primary">
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;