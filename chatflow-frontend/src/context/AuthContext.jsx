// Updated context/AuthContext.js with OTP functionality
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
        token: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'OTP_SEND_START':
      return { ...state, otpLoading: true, otpError: null };
    case 'OTP_SEND_SUCCESS':
      return {
        ...state,
        otpLoading: false,
        otpSent: true,
        pendingVerification: action.payload,
        otpError: null
      };
    case 'OTP_SEND_FAILURE':
      return {
        ...state,
        otpLoading: false,
        otpError: action.payload,
        otpSent: false
      };
    case 'OTP_VERIFY_START':
      return { ...state, otpVerifying: true, otpError: null };
    case 'OTP_VERIFY_SUCCESS':
      return {
        ...state,
        otpVerifying: false,
        otpSent: false,
        pendingVerification: null,
        otpError: null
      };
    case 'OTP_VERIFY_FAILURE':
      return {
        ...state,
        otpVerifying: false,
        otpError: action.payload
      };
    case 'CLEAR_OTP_STATE':
      return {
        ...state,
        otpLoading: false,
        otpVerifying: false,
        otpSent: false,
        otpError: null,
        pendingVerification: null
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
  // OTP related state
  otpLoading: false,
  otpVerifying: false,
  otpSent: false,
  otpError: null,
  pendingVerification: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let parsedUser = null;
    try {
      parsedUser = (userStr && userStr !== "undefined") ? JSON.parse(userStr) : null;
    } catch (e) {
      parsedUser = null;
    }
    if (token && parsedUser) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user: parsedUser }
      });
    }
  }, []);

  // Apply theme when user changes
  useEffect(() => {
    if (state.user?.theme) {
      document.documentElement.setAttribute('data-theme', state.user.theme);
    }
  }, [state.user?.theme]);

  // Login function (unchanged)
  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authAPI.login(credentials);
      
      const { token, user } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user }
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function (unchanged - for existing flow)
  const register = async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authAPI.register(userData);
      
      const { token, user } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user }
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // NEW: Send OTP for email verification
  const sendOTP = async (userData) => {
    try {
      dispatch({ type: 'OTP_SEND_START' });
      const response = await authAPI.sendOTP(userData);
      
      dispatch({
        type: 'OTP_SEND_SUCCESS',
        payload: response.data
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send verification email';
      dispatch({
        type: 'OTP_SEND_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // NEW: Verify email and complete registration
  const verifyEmailAndRegister = async (verificationData) => {
    try {
      dispatch({ type: 'OTP_VERIFY_START' });
      const response = await authAPI.verifyEmailAndRegister(verificationData);
      
      const { token, user } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'OTP_VERIFY_SUCCESS'
      });
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user }
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Email verification failed';
      dispatch({
        type: 'OTP_VERIFY_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // NEW: Check verification status
  const checkVerificationStatus = async (firebaseUid) => {
    try {
      const response = await authAPI.checkVerificationStatus(firebaseUid);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to check verification status';
      return { success: false, error: errorMessage };
    }
  };

  // NEW: Resend verification email
  const resendVerificationEmail = async (firebaseUid) => {
    try {
      dispatch({ type: 'OTP_SEND_START' });
      const response = await authAPI.resendVerificationEmail(firebaseUid);
      
      dispatch({
        type: 'OTP_SEND_SUCCESS',
        payload: response.data
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
      dispatch({
        type: 'OTP_SEND_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Update user function (unchanged)
  const updateUser = (userData) => {
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update context state
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    });
  };

  // Logout function (unchanged)
  const logout = () => {
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset theme
    document.documentElement.removeAttribute('data-theme');
    
    // Clear state
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error function (enhanced)
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // NEW: Clear OTP state
  const clearOTPState = () => {
    dispatch({ type: 'CLEAR_OTP_STATE' });
  };

  const value = {
    ...state,
    login,
    register,
    sendOTP,
    verifyEmailAndRegister,
    checkVerificationStatus,
    resendVerificationEmail,
    updateUser,
    logout,
    clearError,
    clearOTPState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};