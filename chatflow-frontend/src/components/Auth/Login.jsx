// components/Auth/Login.jsx - Updated with OTP registration option
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const { login, loading, error, isAuthenticated, clearError } = useAuth();
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      navigate('/chat');
    }
  };

  // Styles (same as before)
  const loginContainerStyle = {
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

  const loginCardStyle = {
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
    border: '2px solid #40444b',
    borderRadius: '5px',
    fontSize: '1rem',
    transition: 'border-color 0.3s ease',
    backgroundColor: '#40444b',
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
    backgroundColor: '#f04747',
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

  const dividerStyle = {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
    color: '#72767d'
  };

  const dividerLineStyle = {
    flex: 1,
    height: '1px',
    backgroundColor: '#40444b'
  };

  const dividerTextStyle = {
    padding: '0 1rem',
    fontSize: '12px',
    textTransform: 'uppercase',
    fontWeight: '600'
  };

  const secureRegisterStyle = {
    ...buttonStyle,
    backgroundColor: '#43b581',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  };

  const secureRegisterHoverStyle = {
    backgroundColor: '#3ca374'
  };

  return (
    <div style={loginContainerStyle}>
      {/* Background CHATFLOW */}
      <div style={backgroundTextStyle}>ChatFlow</div>
      {/* Login Card */}
      <div style={loginCardStyle}>
        <h1 style={titleStyle}>Welcome Back</h1>
        {error && <div style={errorMessageStyle}>{error}</div>}
        <form style={formStyle} onSubmit={handleSubmit}>
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
              autoComplete="current-password"
            />
            <span
              style={eyeIconStyle}
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={0}
              role="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
          <button
            style={loading ? {...buttonStyle, ...buttonDisabledStyle} : buttonStyle}
            type="submit"
            disabled={loading}
            onMouseEnter={(e) => !loading && Object.assign(e.target.style, buttonHoverStyle)}
            onMouseLeave={(e) => !loading && Object.assign(e.target.style, buttonStyle)}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={dividerStyle}>
          <div style={dividerLineStyle}></div>
          <span style={dividerTextStyle}>or</span>
          <div style={dividerLineStyle}></div>
        </div>
        
        <Link
          to="/register-otp"
          style={secureRegisterStyle}
          onMouseEnter={(e) => Object.assign(e.target.style, secureRegisterHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, secureRegisterStyle)}
        >
          <FaShieldAlt />
          Create Account with Email Verification
        </Link>
        
        <p style={linkTextStyle}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Quick Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;