// Updated components/Chat/ChatWindow.jsx
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import UserList from './UserList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ProfileModal from '../Profile/ProfileModal';
import './ChatWindow.css';

const ChatWindow = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket, connectSocket, disconnectSocket } = useContext(SocketContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    // Connect socket when component mounts
    if (user && !socket) {
      connectSocket();
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        disconnectSocket();
      }
    };
  }, [user, socket, connectSocket, disconnectSocket]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsMobileMenuOpen(false); // Close mobile menu when user is selected
  };

  const handleLogout = () => {
    if (socket) {
      disconnectSocket();
    }
    logout();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            ☰
          </button>
          <h1>ChatFlow</h1>
        </div>

        <div className="header-center">
          {selectedUser && (
            <div className="current-chat-info">
              <img 
                src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.username}&background=random`}
                alt={selectedUser.username}
                className="current-chat-avatar"
              />
              <div className="current-chat-details">
                <span className="current-chat-name">{selectedUser.username}</span>
                <span className="current-chat-status">
                  {selectedUser.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="header-right">
          <div className="user-menu">
  <div className="user-info" onClick={openProfileModal} title="Profile & Settings">
    <img 
      src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
      alt={user.username}
      className="user-avatar"
    />
    <span className="username">{user.username}</span>
  </div>
  <div className="user-actions">
    <button className="logout-btn" onClick={handleLogout} title="Logout">
      Logout
    </button>
  </div>
</div>

        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-container">
        {/* Sidebar */}
        <div className={`chat-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <UserList 
            onUserSelect={handleUserSelect} 
            selectedUser={selectedUser}
            onMobileClose={isMobileMenuOpen ? closeMobileMenu : null}
          />
        </div>

        {/* Chat Area */}
        <div className="chat-main">
          <div className="chat-messages">
            <MessageList selectedUser={selectedUser} />
          </div>

          <div className="chat-input">
            <MessageInput selectedUser={selectedUser} />
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={closeProfileModal} 
      />
    </div>
  );
};

export default ChatWindow;