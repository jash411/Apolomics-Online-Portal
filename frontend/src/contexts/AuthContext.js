import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      
      axios.get('http://localhost:8000/api/users/current_user/')
        .then(response => {
          setUser(response.data);
        })
        .catch(error => {
          console.error('Error fetching current user:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:8000/api/users/register/', userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data).flat();
        return { success: false, error: errorMessages.join(', ') };
      }
      return { success: false, error: 'Registration failed' };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post('http://localhost:8000/api/users/login/', credentials);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // ADD THESE ROLE-CHECKING FUNCTIONS
  const isStudent = () => {
    return user && user.user_type === 'student';
  };

  const isInstructor = () => {
    return user && user.user_type === 'instructor';
  };

  const isAdmin = () => {
    return user && user.user_type === 'admin';
  };

  const value = {
    user,
    register,
    login,
    logout,
    loading,
    isStudent,    // Add this
    isInstructor, // Add this
    isAdmin       // Add this
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};