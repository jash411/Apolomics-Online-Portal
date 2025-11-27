import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, token } = useAuth();

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
        <InstructorDashboard user={user} token={token} />
      ) : (
        <StudentDashboard user={user} token={token} />
      )}
      
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <button onClick={logout} className="btn btn-outline">
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

const InstructorDashboard = ({ user, token }) => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    satisfaction: '0%',
    avgRating: 0
  });

  useEffect(() => {
    fetchInstructorStats();
  }, []);

  const fetchInstructorStats = async () => {
    try {
      // Fetch instructor's courses
      const coursesResponse = await fetch('http://localhost:8000/api/courses/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (coursesResponse.ok) {
        const courses = await coursesResponse.json();
        const myCourses = courses.filter(course => course.instructor === user.id);
        
        // Calculate total students across all courses
        let totalStudents = 0;
        myCourses.forEach(course => {
          totalStudents += course.enrollments_count || 0;
        });

        setStats({
          totalCourses: myCourses.length,
          totalStudents: totalStudents,
          satisfaction: '98%', // You can calculate this from reviews
          avgRating: 4.8 // You can calculate this from reviews
        });
      }
    } catch (error) {
      console.error('Error fetching instructor stats:', error);
    }
  };

  return (
    <div className="fade-in-up">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalCourses}</div>
          <div className="stat-label">Total Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalStudents}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.satisfaction}</div>
          <div className="stat-label">Satisfaction</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.avgRating}</div>
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

const StudentDashboard = ({ user, token }) => {
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    certificates: 0,
    hoursLearned: 0,
    avgProgress: 0,
    pendingAssignments: 0,
    availableExams: 0
  });

  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch enrolled courses
      const coursesResponse = await fetch('http://localhost:8000/api/courses/my_courses/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      // Fetch certificates
      const certResponse = await fetch('http://localhost:8000/api/certificates/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      // Fetch assignments
      const assignmentsResponse = await fetch('http://localhost:8000/api/assignments/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      // Fetch exams
      const examsResponse = await fetch('http://localhost:8000/api/exams/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      const [coursesData, certData, assignmentsData, examsData] = await Promise.all([
        coursesResponse.ok ? coursesResponse.json() : [],
        certResponse.ok ? certResponse.json() : [],
        assignmentsResponse.ok ? assignmentsResponse.json() : [],
        examsResponse.ok ? examsResponse.json() : []
      ]);

      console.log('📊 Dashboard data:', {
        courses: coursesData,
        certificates: certData,
        assignments: assignmentsData,
        exams: examsData
      });

      // Calculate statistics
      const enrolledCourses = coursesData.length;
      const certificates = certData.length;
      
      // Calculate total hours learned and average progress
      let totalHours = 0;
      let totalProgress = 0;
      let pendingAssignments = 0;
      let availableExams = 0;

      coursesData.forEach(course => {
        totalHours += course.duration || 0;
        totalProgress += course.progress_percentage || 0;
      });

      // Check for pending assignments (submitted but not approved)
      const assignmentSubmissionsResponse = await fetch('http://localhost:8000/api/assignment-submissions/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (assignmentSubmissionsResponse.ok) {
        const submissions = await assignmentSubmissionsResponse.json();
        pendingAssignments = submissions.filter(sub => 
          sub.student === user.id && sub.status !== 'approved'
        ).length;
      }

      // Check for available exams (courses where assignment is approved but exam not taken)
      const examSubmissionsResponse = await fetch('http://localhost:8000/api/exam-submissions/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (examSubmissionsResponse.ok) {
        const examSubmissions = await examSubmissionsResponse.json();
        const submittedExamIds = examSubmissions.map(sub => sub.exam);
        
        availableExams = examsData.filter(exam => 
          !submittedExamIds.includes(exam.id)
        ).length;
      }

      setStats({
        enrolledCourses,
        certificates,
        hoursLearned: totalHours,
        avgProgress: enrolledCourses > 0 ? Math.round(totalProgress / enrolledCourses) : 0,
        pendingAssignments,
        availableExams
      });

      setRecentCourses(coursesData.slice(0, 3)); // Show 3 most recent courses
      setLoading(false);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getCourseStatus = (course) => {
    if (course.progress_percentage === 100) return 'completed';
    if (course.progress_percentage > 0) return 'in-progress';
    return 'not-started';
  };

  if (loading) {
    return (
      <div className="fade-in-up">
        <div className="loading-dashboard">
          <div className="loading-spinner"></div>
          <p>Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.enrolledCourses}</div>
          <div className="stat-label">Enrolled Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.hoursLearned}h</div>
          <div className="stat-label">Hours Learned</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.certificates}</div>
          <div className="stat-label">Certificates</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.avgProgress}%</div>
          <div className="stat-label">Avg Progress</div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          {stats.pendingAssignments > 0 && (
            <div className="action-item warning">
              <span className="action-icon">📝</span>
              <div className="action-content">
                <strong>{stats.pendingAssignments} Pending Assignment(s)</strong>
                <p>Waiting for instructor review</p>
              </div>
              <Link to="/assignments" className="btn btn-small">
                Review
              </Link>
            </div>
          )}
          
          {stats.availableExams > 0 && (
            <div className="action-item info">
              <span className="action-icon">🎯</span>
              <div className="action-content">
                <strong>{stats.availableExams} Available Exam(s)</strong>
                <p>Ready to take final exams</p>
              </div>
              <Link to="/exams" className="btn btn-small btn-primary">
                Take Exam
              </Link>
            </div>
          )}
          
          {stats.certificates > 0 && (
            <div className="action-item success">
              <span className="action-icon">🏆</span>
              <div className="action-content">
                <strong>{stats.certificates} Certificate(s) Earned</strong>
                <p>View and download your achievements</p>
              </div>
              <Link to="/certificates" className="btn btn-small btn-secondary">
                View All
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Courses Section */}
      {recentCourses.length > 0 && (
        <div className="recent-courses">
          <h3>Continue Learning</h3>
          <div className="courses-grid">
            {recentCourses.map(course => (
              <div key={course.id} className="course-card-mini">
                <div className="course-mini-header">
                  <h4>{course.title}</h4>
                  <span className={`status-badge ${getCourseStatus(course)}`}>
                    {getCourseStatus(course) === 'completed' ? '✅' : 
                     getCourseStatus(course) === 'in-progress' ? '🔄' : '⏸️'}
                  </span>
                </div>
                <div className="progress-bar-mini">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${course.progress_percentage || 0}%` }}
                  ></div>
                </div>
                <div className="course-mini-stats">
                  <span>Progress: {course.progress_percentage || 0}%</span>
                  <span>{course.duration || 0}h</span>
                </div>
                <Link to={`/learn-sequential/${course.id}`} className="btn btn-small">
                  {course.progress_percentage === 100 ? 'Review' : 'Continue'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

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