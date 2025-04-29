import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay un token en localStorage al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Endpoint para verificar el token y obtener datos del usuario
          const response = await api.get('/auth/me');
          setCurrentUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error de autenticación:', err);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/token', new URLSearchParams({
        username,
        password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      const userResponse = await api.get('/auth/me');
      setCurrentUser(userResponse.data);
      setIsAuthenticated(true);
      
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error de inicio de sesión');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const register = async (userData) => {
    try {
      setError(null);
      await api.post('/auth/register', userData);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar usuario');
      return false;
    }
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};