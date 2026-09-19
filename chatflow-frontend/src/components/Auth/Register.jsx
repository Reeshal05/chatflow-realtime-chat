// components/Auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { register, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    if (result.success) {
      navigate('/chat');
    }
  };

  // Styles
  const registerContainerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2f3136',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: 'relative',
    overflow: 'hidden'
  };

  const backgroundTextStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '20vw',
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.08)',
    userSelect: 'none',
    pointerEvents: 'none',
    zIndex: 1,
    whiteSpace: 'nowrap'
  };

  const registerCardStyle = {
    backgroundColor: 'rgba(55, 55, 55, 0.35)',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15)',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid rgba(32, 34, 37, 0.2)',
    position: 'relative',
    zIndex: 2,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(2px)',
    overflow: 'hidden'
  };

  const titleStyle = {
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: '1.5rem',
    fontSize: '2rem',
    fontWeight: '600',
    margin: '0 0 1.5rem 0'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const inputGroupStyle = {
    marginBottom: '1rem',
    position: 'relative'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#dcddde',
    fontWeight: '500',
    fontSize: '14px'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid rgba(64, 68, 75, 0.8)',
    borderRadius: '5px',
    fontSize: '1rem',
    transition: 'border-color 0.3s ease',
    backgroundColor: 'rgba(64, 68, 75, 0.8)',
    color: '#dcddde',
    boxSizing: 'border-box'
  };

  const inputFocusStyle = {
    outline: 'none',
    borderColor: '#7289da'
  };

  const eyeIconStyle = {
    position: 'absolute',
    top: '50%',
    right: '12px',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    color: '#7289da',
    fontSize: '1.2rem',
    zIndex: 3
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#5865f2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    marginTop: '0.5rem'
  };

  const buttonHoverStyle = {
    backgroundColor: '#4752c4'
  };

  const buttonDisabledStyle = {
    opacity: '0.6',
    cursor: 'not-allowed',
    backgroundColor: '#5865f2'
  };

  const errorMessageStyle = {
    backgroundColor: 'rgba(240, 71, 71, 0.9)',
    color: 'white',
    padding: '0.75rem',
    borderRadius: '5px',
    marginBottom: '1rem',
    textAlign: 'center',
    fontSize: '14px'
  };

  const linkTextStyle = {
    textAlign: 'center',
    marginTop: '1rem',
    color: '#dcddde',
    fontSize: '14px',
    margin: '1rem 0 0 0'
  };

  const linkStyle = {
    color: '#7289da',
    textDecoration: 'none',
    fontWeight: '500'
  };

  return (
    <div style={registerContainerStyle}>
      {/* Background CHATFLOW */}
      <div style={backgroundTextStyle}>ChatFlow</div>
      {/* Form Card */}
      <div style={registerCardStyle}>
        <h1 style={titleStyle}>Create Account</h1>
        {(error || validationError) && (
          <div style={errorMessageStyle}>{validationError || error}</div>
        )}
        <form style={formStyle} onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="username">Username</label>
            <input
              style={inputStyle}
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputStyle)}
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="email">Email</label>
            <input
              style={inputStyle}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputStyle)}
            />
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="password">Password</label>
            <input
              style={inputStyle}
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              autoComplete="new-password"
            />
            <span
              style={eyeIconStyle}
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={0}
              role="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEye />: <FaEyeSlash />}
            </span>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="confirmPassword">Confirm Password</label>
            <input
              style={inputStyle}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              autoComplete="new-password"
            />
            <span
              style={eyeIconStyle}
              onClick={() => setShowConfirmPassword((v) => !v)}
              tabIndex={0}
              role="button"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEye />: <FaEyeSlash />}
            </span>
          </div>
          <button
            style={loading ? {...buttonStyle, ...buttonDisabledStyle} : buttonStyle}
            type="submit"
            disabled={loading}
            onMouseEnter={(e) => !loading && Object.assign(e.target.style, buttonHoverStyle)}
            onMouseLeave={(e) => !loading && Object.assign(e.target.style, buttonStyle)}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p style={linkTextStyle}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
