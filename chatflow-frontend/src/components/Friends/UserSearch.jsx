// components/Friends/UserSearch.jsx
import React, { useState, useContext } from 'react';
import { usersAPI, friendRequestAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import './UserSearch.css';

const UserSearch = ({ onClose, onFriendAdded }) => {
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await usersAPI.searchUsers(query);
      // Backend already filters out current user and provides relationshipStatus
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await friendRequestAPI.sendRequest(userId);
      // Update the search results to reflect the new status
      setSearchResults(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, relationshipStatus: 'request_sent' }
            : user
        )
      );
      
      if (onFriendAdded) {
        onFriendAdded();
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Error sending friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleRemoveFriend = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await friendRequestAPI.removeFriend(userId);
      // Update the search results to reflect the new status
      setSearchResults(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, relationshipStatus: 'none' }
            : user
        )
      );
      
      if (onFriendAdded) {
        onFriendAdded();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Error removing friend');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getActionButton = (searchUser) => {
    const isLoading = actionLoading[searchUser._id];
    
    if (isLoading) {
      return <div className="loading-status">Loading...</div>;
    }

    switch (searchUser.relationshipStatus) {
      case 'friends':
        return (
          <button 
            className="remove-friend-btn"
            onClick={() => handleRemoveFriend(searchUser._id)}
          >
            Remove Friend
          </button>
        );
      case 'request_sent':
        return <div className="status-indicator sent">Request Sent</div>;
      case 'request_received':
        return <div className="status-indicator received">Sent you a request</div>;
      case 'none':
      default:
        return (
          <button 
            className="send-request-btn"
            onClick={() => handleSendRequest(searchUser._id)}
          >
            Add Friend
          </button>
        );
    }
  };

  const getStatusIcon = (relationshipStatus) => {
    switch (relationshipStatus) {
      case 'friends':
        return '✓';
      case 'request_sent':
        return '⏳';
      case 'request_received':
        return '📨';
      default:
        return '';
    }
  };

  return (
    <div className="user-search-overlay">
      <div className="user-search-modal">
        <div className="user-search-header">
          <h3>Add Friends</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search users by username or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="search-input"
          />
        </div>

        <div className="search-results">
          {loading && (
            <div className="loading-results">
              <div className="loading-spinner"></div>
              <p>Searching...</p>
            </div>
          )}

          {!loading && searchQuery && searchResults.length === 0 && (
            <div className="no-results">
              <p>No users found for "{searchQuery}"</p>
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div className="results-list">
              {searchResults.map(searchUser => (
                <div key={searchUser._id} className="result-item">
                  <div className="result-user-info">
                    <img 
                      src={searchUser.avatar || `https://ui-avatars.com/api/?name=${searchUser.username}&background=random`}
                      alt={searchUser.username}
                      className="result-avatar"
                    />
                    <div className="result-details">
                      <div className="result-name">
                        {searchUser.username}
                        <span className="status-icon">
                          {getStatusIcon(searchUser.relationshipStatus)}
                        </span>
                      </div>
                      <div className="result-email">{searchUser.email}</div>
                      <div className="result-status">
                        {searchUser.isOnline ? (
                          <span className="online-indicator">🟢 Online</span>
                        ) : (
                          <span className="offline-indicator">
                            Last seen: {searchUser.lastSeen ? new Date(searchUser.lastSeen).toLocaleDateString() : 'Unknown'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="result-actions">
                    {getActionButton(searchUser)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !searchQuery && (
            <div className="search-placeholder">
              <p>Start typing to search for users...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;