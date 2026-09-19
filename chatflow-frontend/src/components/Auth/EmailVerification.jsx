// components/Auth/EmailVerification.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle, FaSpinner, FaEnvelope } from 'react-icons/fa';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    verifyEmailAndRegister, 
    checkVerificationStatus,
    resendVerificationEmail,
    otpVerifying, 
    otpLoading,
    otpError, 
    isAuthenticated,
    clearOTPState,
    pendingVerification
  } = useAuth();

  const [verificationStatus, setVerificationStatus] = useState('checking');
  const [message, setMessage] = useState('');
  const [firebaseUid, setFirebaseUid] = useState('');
  const [checkingInterval, setCheckingInterval] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleEmailVerification = async () => {
      // First check if we have Firebase redirect parameters
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');
      const apiKey = searchParams.get('apiKey');
      
      // DEBUG: Log the parameters
      console.log('URL Parameters:', {
        mode,
        oobCode,
        apiKey,
        fullUrl: window.location.href
      });
      
      // Check for Firebase UID from URL params or pending verification
      const uidFromUrl = searchParams.get('uid');
      const uidFromState = pendingVerification?.firebaseUid;
      
      // If we have Firebase verification parameters, this is a redirect from Firebase
      if (mode === 'verifyEmail' && oobCode) {
        setVerificationStatus('verifying');
        setMessage('Processing email verification...');
        
        try {
          // Call Firebase REST API to apply the action code
          const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              oobCode: oobCode
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            // Extract Firebase UID from the response
            const firebaseUidFromResponse = data.localId;
            
            if (firebaseUidFromResponse) {
              setFirebaseUid(firebaseUidFromResponse);
              
              // Now complete the registration
              setMessage('Email verified! Completing registration...');
              
              const result = await verifyEmailAndRegister({
                firebaseUid: firebaseUidFromResponse
              });
              
              if (result.success) {
                setVerificationStatus('success');
                setMessage('Registration completed successfully! Redirecting to chat...');
                setTimeout(() => navigate('/chat'), 2000);
              } else {
                setVerificationStatus('error');
                setMessage(result.error || 'Failed to complete registration');
              }
            } else {
              setVerificationStatus('error');
              setMessage('Invalid verification response');
            }
          } else {
            const errorData = await response.json();
            setVerificationStatus('error');
            setMessage(errorData.error?.message || 'Email verification failed');
          }
        } catch (error) {
          console.error('Verification error:', error);
          setVerificationStatus('error');
          setMessage('Failed to verify email. Please try again.');
        }
        
        return; // Exit early for Firebase redirect handling
      }
      
      // If no Firebase parameters, fall back to the original polling logic
      const uid = uidFromUrl || uidFromState;
      
      if (!uid) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. Please try registering again.');
        return;
      }

      setFirebaseUid(uid);
      setVerificationStatus('checking');
      setMessage('Checking email verification status...');
      
      // Start checking verification status
      const intervalId = setInterval(async () => {
        try {
          const statusResult = await checkVerificationStatus(uid);
          
          if (statusResult.success) {
            if (statusResult.data.emailVerified) {
              // Email is verified, clear interval and complete registration
              clearInterval(intervalId);
              setVerificationStatus('verifying');
              setMessage('Email verified! Completing registration...');
              
              const result = await verifyEmailAndRegister({
                firebaseUid: uid
              });
              
              if (result.success) {
                setVerificationStatus('success');
                setMessage('Registration completed successfully! Redirecting to chat...');
                setTimeout(() => navigate('/chat'), 2000);
              } else {
                setVerificationStatus('error');
                setMessage(result.error || 'Failed to complete registration');
              }
            } else {
              // Still waiting for verification
              setVerificationStatus('checking');
              setMessage('Waiting for email verification. Please check your email and click the verification link.');
            }
          } else {
            clearInterval(intervalId);
            setVerificationStatus('error');
            setMessage(statusResult.error || 'Failed to check verification status');
          }
        } catch (error) {
          clearInterval(intervalId);
          setVerificationStatus('error');
          setMessage('An error occurred during verification');
        }
      }, 2000);

      setCheckingInterval(intervalId);

      // Clear interval after 5 minutes
      setTimeout(() => {
        clearInterval(intervalId);
        if (verificationStatus === 'checking') {
          setVerificationStatus('expired');
          setMessage('Verification timeout. Please try again or resend the verification email.');
        }
      }, 300000);
    };

    handleEmailVerification();

    // Cleanup interval on unmount
    return () => {
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    };
  }, [searchParams, verifyEmailAndRegister, checkVerificationStatus, navigate, pendingVerification]);

  const handleResendEmail = async () => {
    if (!firebaseUid) return;
    
    const result = await resendVerificationEmail(firebaseUid);
    if (result.success) {
      setMessage('Verification email resent! Please check your inbox and click the verification link.');
      setVerificationStatus('checking');
      
      // Restart checking
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
      
      const intervalId = setInterval(async () => {
        try {
          const statusResult = await checkVerificationStatus(firebaseUid);
          
          if (statusResult.success && statusResult.data.emailVerified) {
            clearInterval(intervalId);
            setVerificationStatus('verifying');
            setMessage('Email verified! Completing registration...');
            
            const result = await verifyEmailAndRegister({
              firebaseUid: firebaseUid
            });
            
            if (result.success) {
              setVerificationStatus('success');
              setMessage('Registration completed successfully! Redirecting to chat...');
              setTimeout(() => navigate('/chat'), 2000);
            } else {
              setVerificationStatus('error');
              setMessage(result.error || 'Failed to complete registration');
            }
          }
        } catch (error) {
          clearInterval(intervalId);
          setVerificationStatus('error');
          setMessage('An error occurred during verification');
        }
      }, 2000);
      
      setCheckingInterval(intervalId);
    }
  };

  const handleGoToLogin = () => {
    if (checkingInterval) {
      clearInterval(checkingInterval);
    }
    clearOTPState();
    navigate('/login');
  };

  // ... rest of your component remains the same
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
    overflow: 'hidden',
    textAlign: 'center'
  };

  const titleStyle = {
    color: '#ffffff',
    marginBottom: '1.5rem',
    fontSize: '2rem',
    fontWeight: '600',
    margin: '0 0 1.5rem 0'
  };

  const iconStyle = {
    fontSize: '4rem',
    marginBottom: '1rem',
    display: 'block'
  };

  const messageStyle = {
    color: '#dcddde',
    fontSize: '1rem',
    marginBottom: '2rem',
    lineHeight: '1.5'
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
    marginBottom: '0.5rem',
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
    color: '#5865f2'
  };

  const getStatusContent = () => {
    switch (verificationStatus) {
      case 'checking':
        return {
          icon: <FaSpinner className="fa-spin" style={{ ...iconStyle, color: '#5865f2' }} />,
          title: 'Checking Verification...',
          message: message || 'Please check your email and click the verification link to continue.',
          showButtons: true
        };
      
      case 'verifying':
        return {
          icon: <FaSpinner className="fa-spin" style={{ ...iconStyle, color: '#5865f2' }} />,
          title: 'Completing Registration...',
          message: message || 'Please wait while we complete your registration.',
          showButtons: false
        };
      
      case 'success':
        return {
          icon: <FaCheckCircle style={{ ...iconStyle, color: '#43b581' }} />,
          title: 'Registration Complete!',
          message: message || 'Your email has been verified and registration is complete. Welcome to ChatFlow!',
          showButtons: false
        };
      
      case 'error':
        return {
          icon: <FaExclamationCircle style={{ ...iconStyle, color: '#f04747' }} />,
          title: 'Verification Failed',
          message: message || 'There was an error verifying your email. Please try again.',
          showButtons: true
        };
      
      case 'expired':
        return {
          icon: <FaEnvelope style={{ ...iconStyle, color: '#faa61a' }} />,
          title: 'Verification Timeout',
          message: message || 'Email verification is taking too long. Please try resending the verification email.',
          showButtons: true
        };
      
      default:
        return {
          icon: <FaSpinner className="fa-spin" style={{ ...iconStyle, color: '#5865f2' }} />,
          title: 'Processing...',
          message: 'Please wait...',
          showButtons: false
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div style={containerStyle}>
      <div style={backgroundTextStyle}>ChatFlow</div>
      <div style={cardStyle}>
        {statusContent.icon}
        <h1 style={titleStyle}>{statusContent.title}</h1>
        <p style={messageStyle}>{statusContent.message}</p>
        
        {statusContent.showButtons && (
          <div>
            {firebaseUid && (
              <button
                style={otpLoading ? {...buttonStyle, ...buttonDisabledStyle} : buttonStyle}
                onClick={handleResendEmail}
                disabled={otpLoading}
                onMouseEnter={(e) => !otpLoading && Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => !otpLoading && Object.assign(e.target.style, buttonStyle)}
              >
                {otpLoading ? (
                  <>
                    <FaSpinner className="fa-spin" />
                    Resending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            )}
            
            <button
              style={secondaryButtonStyle}
              onClick={handleGoToLogin}
              onMouseEnter={(e) => Object.assign(e.target.style, { backgroundColor: 'rgba(88, 101, 242, 0.1)' })}
              onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: 'transparent' })}
            >
              Go to Login
            </button>
          </div>
        )}
        
        {otpError && (
          <div style={{
            backgroundColor: 'rgba(240, 71, 71, 0.9)',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '5px',
            marginTop: '1rem',
            fontSize: '14px'
          }}>
            {otpError}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;