// components/Profile/DeleteProfileModal.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { usersAPI } from '../../services/api';
import './DeleteProfileModal.css';

const DeleteProfileModal = ({ isOpen, onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Warning, 2: Confirmation

  const requiredText = 'DELETE MY ACCOUNT';

  const handleDeleteProfile = async () => {
    if (confirmationText !== requiredText) {
      setError('Please type the confirmation text exactly as shown');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await usersAPI.deleteProfile();
      
      // Account deleted successfully - logout user
      logout();
      
      // Close modal and redirect will be handled by logout
      onClose();
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStep(1);
      setConfirmationText('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="delete-profile-modal-overlay" onClick={handleClose}>
      <div className="delete-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-profile-modal-header">
          <h2>Delete Account</h2>
          <button 
            className="close-btn" 
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="delete-profile-modal-content">
          {step === 1 && (
            <div className="warning-step">
              <div className="warning-icon">⚠️</div>
              <h3>This action cannot be undone!</h3>
              <p>Deleting your account will permanently remove:</p>
              <ul className="deletion-list">
                <li>Your profile and all personal information</li>
                <li>All your messages and chat history</li>
                <li>All friend connections and requests</li>
                <li>Your account settings and preferences</li>
              </ul>
              <p className="warning-text">
                Once deleted, this data cannot be recovered. Are you sure you want to proceed?
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="confirmation-step">
              <div className="danger-icon">🚨</div>
              <h3>Final Confirmation</h3>
              <p>
                To confirm account deletion, please type: <br />
                <strong className="confirmation-text">{requiredText}</strong>
              </p>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type confirmation text here"
                className="confirmation-input"
                disabled={loading}
              />
              <p className="final-warning">
                This will permanently delete your account: <strong>{user?.username}</strong>
              </p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="delete-profile-actions">
            {step === 1 && (
              <>
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  className="continue-btn"
                  disabled={loading}
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="back-btn"
                  disabled={loading}
                >
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteProfile}
                  className="delete-btn"
                  disabled={loading || confirmationText !== requiredText}
                >
                  {loading ? 'Deleting Account...' : 'Delete My Account'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProfileModal;