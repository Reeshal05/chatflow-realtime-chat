// components/Friends/FriendRequests.jsx
import React, { useState, useEffect, useContext } from 'react';
import { friendRequestAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import './FriendRequests.css';

const FriendRequests = ({ onClose, onFriendAdded }) => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('received');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    setLoading(true);
    try {
      const [receivedRes, sentRes] = await Promise.all([
        friendRequestAPI.getReceivedRequests(),
        friendRequestAPI.getSentRequests()
      ]);
      
      setReceivedRequests(receivedRes.data);
      setSentRequests(sentRes.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await friendRequestAPI.acceptRequest(requestId);
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
      // Notify parent component about new friend
      if (onFriendAdded) {
        onFriendAdded();
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Error accepting friend request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await friendRequestAPI.rejectRequest(requestId);
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Error rejecting friend request');
    }
  };

  // ✅ REMOVED: handleCancelRequest function since backend doesn't provide cancel endpoint
  // Users will need to wait for the request to be accepted/rejected

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="friend-requests-overlay">
      <div className="friend-requests-modal">
        <div className="friend-requests-header">
          <h3>Friend Requests</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="friend-requests-tabs">
          <button 
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            Received {receivedRequests.length > 0 && `(${receivedRequests.length})`}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
          </button>
        </div>

        <div className="friend-requests-content">
          {loading && (
            <div className="loading-requests">
              <div className="loading-spinner"></div>
              <p>Loading requests...</p>
            </div>
          )}

          {!loading && activeTab === 'received' && (
            <div className="received-requests">
              {receivedRequests.length === 0 ? (
                <div className="no-requests">
                  <p>No friend requests received</p>
                </div>
              ) : (
                receivedRequests.map(request => (
                  <div key={request._id} className="request-item">
                    <div className="request-user-info">
                      <img 
                        src={request.requester.avatar || `https://ui-avatars.com/api/?name=${request.requester.username}&background=random`}
                        alt={request.requester.username}
                        className="request-avatar"
                      />
                      <div className="request-details">
                        <div className="request-name">{request.requester.username}</div>
                        <div className="request-email">{request.requester.email}</div>
                        {request.message && (
                          <div className="request-message">"{request.message}"</div>
                        )}
                        <div className="request-time">
                          {formatDate(request.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="request-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => handleAcceptRequest(request._id)}
                      >
                        Accept
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleRejectRequest(request._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && activeTab === 'sent' && (
            <div className="sent-requests">
              {sentRequests.length === 0 ? (
                <div className="no-requests">
                  <p>No friend requests sent</p>
                </div>
              ) : (
                sentRequests.map(request => (
                  <div key={request._id} className="request-item">
                    <div className="request-user-info">
                      <img 
                        src={request.recipient.avatar || `https://ui-avatars.com/api/?name=${request.recipient.username}&background=random`}
                        alt={request.recipient.username}
                        className="request-avatar"
                      />
                      <div className="request-details">
                        <div className="request-name">{request.recipient.username}</div>
                        <div className="request-email">{request.recipient.email}</div>
                        {request.message && (
                          <div className="request-message">Message: "{request.message}"</div>
                        )}
                        <div className="request-time">
                          Sent {formatDate(request.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="request-actions">
                      <div className="status-indicator pending">Pending</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;