// components/Profile/ProfileModal.jsx - Updated version
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { usersAPI } from '../../services/api';
import DeleteProfileModal from './DeleteProfileModal';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatar: '',
    theme: 'light',
    notifications: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || '',
        theme: user.theme || 'light',
        notifications: user.notifications !== undefined ? user.notifications : true
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData(prev => ({
          ...prev,
          avatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await usersAPI.updateProfile(formData);
      
      // Update user in context
      updateUser(response.data.user);
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="profile-modal-header">
            <h2>Profile Settings</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            {/* Avatar Section */}
            <div className="profile-section">
              <h3>Profile Picture</h3>
              <div className="avatar-upload">
                <div className="avatar-preview">
                  <img 
                    src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.username}&background=random`}
                    alt="Profile"
                    className="avatar-image"
                  />
                </div>
                <div className="avatar-controls">
                  <input
                    type="file"
                    id="avatar-input"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="avatar-input"
                  />
                  <label htmlFor="avatar-input" className="avatar-upload-btn">
                    Change Avatar
                  </label>
                </div>
              </div>
            </div>

            {/* Basic Info Section */}
            <div className="profile-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Settings Section */}
            <div className="profile-section">
              <h3>Preferences</h3>
              <div className="form-group">
                <label htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  name="theme"
                  value={formData.theme}
                  onChange={handleInputChange}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={formData.notifications}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Enable notifications</span>
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="profile-section danger-zone">
              <h3>Danger Zone</h3>
              <div className="danger-zone-content">
                <div className="danger-zone-text">
                  <h4>Delete Account</h4>
                  <p>Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <button 
                  type="button" 
                  className="danger-btn"
                  onClick={handleDeleteClick}
                  disabled={loading}
                >
                  Delete Account
                </button>
              </div>
            </div>

            {/* Messages */}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Actions */}
            <div className="profile-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="save-btn">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Profile Modal */}
      <DeleteProfileModal 
        isOpen={showDeleteModal}
        onClose={handleDeleteModalClose}
      />
    </>
  );
};

export default ProfileModal;