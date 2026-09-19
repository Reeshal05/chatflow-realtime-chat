// components/Auth/OTPRegister.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEye, FaEyeSlash, FaEnvelope, FaSpinner } from 'react-icons/fa';

const OTPRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [step, setStep] = useState(1); // 1: Form, 2: Email Verification

  const { 
    sendOTP, 
    otpLoading, 
    otpError, 
    otpSent, 
    pendingVerification,
    isAuthenticated, 
    clearOTPState 
  } = useAuth();
  
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (otpSent && pendingVerification) {
      setStep(2);
    }
  }, [otpSent, pendingVerification]);

  // Cleanup OTP state on unmount
  useEffect(() => {
    return () => {
      clearOTPState();
    };
  }, []);

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

    const { confirmPassword, ...userData } = formData;
    const result = await sendOTP(userData);
    
    if (result.success) {
      setStep(2);
    }
  };

  const handleBackToForm = () => {
    setStep(1);
    clearOTPState();
  };

  // Styles (similar to Register component but with OTP theming)
  const containerStyle = {
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

  const cardStyle = {
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

  const subtitleStyle = {
    textAlign: 'center',
    color: '#b3b3b3',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
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
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  };

  const buttonHoverStyle = {
    backgroundColor: '#4752c4'
  };

  const buttonDisabledStyle = {
    opacity: '0.6',
    cursor: 'not-allowed',
    backgroundColor: '#5865f2'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    border: '2px solid #5865f2',
    color: '#5865f2',
    marginTop: '0.5rem'
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

  const successMessageStyle = {
    backgroundColor: 'rgba(67, 181, 129, 0.9)',
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

  const emailVerificationStyle = {
    textAlign: 'center',
    color: '#dcddde',
    fontSize: '14px',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  };

  const emailIconStyle = {
    fontSize: '3rem',
    color: '#5865f2',
    marginBottom: '0.5rem'
  };

  if (step === 2) {
    return (
      <div style={containerStyle}>
        <div style={backgroundTextStyle}>ChatFlow</div>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Check Your Email</h1>
          <div style={emailVerificationStyle}>
            <FaEnvelope style={emailIconStyle} />
            <p>We've sent a verification email to:</p>
            <strong style={{ color: '#7289da' }}>{formData.email}</strong>
            <p>Please check your email and click the verification link to complete your registration.</p>
          </div>
          
          {otpError && (
            <div style={errorMessageStyle}>{otpError}</div>
          )}
          
          <button
            style={secondaryButtonStyle}
            onClick={handleBackToForm}
            onMouseEnter={(e) => Object.assign(e.target.style, { backgroundColor: 'rgba(88, 101, 242, 0.1)' })}
            onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: 'transparent' })}
          >
            Back to Form
          </button>
          
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
  }

  return (
    <div style={containerStyle}>
      <div style={backgroundTextStyle}>ChatFlow</div>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Create Account</h1>
        <p style={subtitleStyle}>Join ChatFlow with email verification</p>
        
        {(otpError || validationError) && (
          <div style={errorMessageStyle}>{validationError || otpError}</div>
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
              {showPassword ? <FaEye /> : <FaEyeSlash />}
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
              {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
          
          <button
            style={otpLoading ? {...buttonStyle, ...buttonDisabledStyle} : buttonStyle}
            type="submit"
            disabled={otpLoading}
            onMouseEnter={(e) => !otpLoading && Object.assign(e.target.style, buttonHoverStyle)}
            onMouseLeave={(e) => !otpLoading && Object.assign(e.target.style, buttonStyle)}
          >
            {otpLoading ? (
              <>
                <FaSpinner className="fa-spin" />
                Sending Email...
              </>
            ) : (
              'Send Verification Email'
            )}
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

export default OTPRegister;