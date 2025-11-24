import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CreateCourse from './pages/CreateCourse';
import MyCourses from './pages/MyCourses';
import CoursePlayer from './pages/CoursePlayer';
import PlaceholderPage from './pages/PlaceHolderPage';
import './App.css';

// Protected Route component - MOVE THIS BEFORE App function
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Role-based protected route - MOVE THIS BEFORE App function
const InstructorRoute = ({ children }) => {
  const { user, isInstructor, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user && isInstructor() ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/courses" element={<Courses />} />
              <Route 
                path="/courses/create" 
                element={
                  <InstructorRoute>
                    <CreateCourse />
                  </InstructorRoute>
                } 
              />
              <Route 
                path="/my-courses" 
                element={
                  <ProtectedRoute>
                    <MyCourses />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learn/:courseId" 
                element={
                  <ProtectedRoute>
                    <CoursePlayer />
                  </ProtectedRoute>
                } 
              />
              
              {/* Add these routes for footer links */}
              <Route path="/about" element={<PlaceholderPage />} />
              <Route path="/faculty" element={<PlaceholderPage />} />
              <Route path="/resources" element={<PlaceholderPage />} />
              <Route path="/blog" element={<PlaceholderPage />} />
              <Route path="/courses/certificate" element={<PlaceholderPage />} />
              <Route path="/courses/diploma" element={<PlaceholderPage />} />
              <Route path="/courses/masterclass" element={<PlaceholderPage />} />
              <Route path="/courses/workshops" element={<PlaceholderPage />} />
              <Route path="/scholarships" element={<PlaceholderPage />} />
              <Route path="/admissions" element={<PlaceholderPage />} />
              <Route path="/privacy" element={<PlaceholderPage />} />
              <Route path="/terms" element={<PlaceholderPage />} />
              <Route path="/cookies" element={<PlaceholderPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;