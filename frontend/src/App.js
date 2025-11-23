import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CreateCourse from './pages/CreateCourse';
import MyCourses from './pages/MyCourses';
import CoursePlayer from './pages/CoursePlayer';
import './App.css';

// Protected Route component - ADD THIS
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Role-based protected route - ADD THIS
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
          <main>
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
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;