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
  const [token, setToken] = useState(localStorage.getItem('token')); // Add token state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
      
      axios.get('http://localhost:8000/api/users/current_user/')
        .then(response => {
          setUser(response.data);
        })
        .catch(error => {
          console.error('Error fetching current user:', error);
          localStorage.removeItem('token');
          setToken(null); // Clear token state
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
        setToken(response.data.token); // Set token state
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
    console.log('🔐 Attempting login with:', credentials);
    
    const response = await axios.post('http://localhost:8000/api/users/login/', {
      username: credentials.username,
      password: credentials.password
    });

    console.log('✅ Login API response:', response.data);
    
    if (response.data.token) {
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Update context state
      setUser(response.data.user);
      setToken(response.data.token);
      
      console.log('✅ Login successful, user:', response.data.user);
      return { success: true, user: response.data.user };
    } else {
      console.log('❌ No token in response');
      return { success: false, error: 'No token received' };
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error);
    console.error('❌ Error details:', error.response?.data);
    
    return { 
      success: false, 
      error: error.response?.data?.error || error.response?.data?.message || 'Login failed' 
    };
  }
};

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null); // Clear token state
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

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
    token, // ADD THIS - this was missing!
    register,
    login,
    logout,
    loading,
    isStudent,
    isInstructor,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};