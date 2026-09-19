import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { usersAPI, messagesAPI } from '../../services/api';
import FriendRequests from '../Friends/FriendRequests';
import UserSearch from '../Friends/UserSearch';
import './UserList.css';

const UserList = ({ onUserSelect, selectedUser, onMobileClose }) => {
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  // Listen for user status changes via socket
  useEffect(() => {
    if (socket) {
      // Listen for user status updates
      socket.on('user_status_update', (data) => {
        console.log('🔄 User status update:', data);
        updateUserStatus(data.userId, data.isOnline, data.lastSeen);
      });

      // Listen for online users list updates
      socket.on('online_users_update', (onlineUsersList) => {
        console.log('👥 Online users update:', onlineUsersList);
        setFriends(prevFriends => 
          prevFriends.map(u => ({
            ...u,
            isOnline: onlineUsersList.includes(u._id)
          }))
        );
      });

      // Listen for new messages to update unread counts
      socket.on('message_received', (message) => {
        console.log('📨 New message received:', message);
        if (message.sender._id !== user._id) {
          // Increment unread count for the sender
          setUnreadCounts(prev => ({
            ...prev,
            [message.sender._id]: (prev[message.sender._id] || 0) + 1
          }));
        }
      });

      // Listen for friend request updates
      socket.on('friend_request_received', (requestData) => {
        console.log('👥 Friend request received:', requestData);
        // You can show a notification here
      });

      socket.on('friend_request_accepted', (friendData) => {
        console.log('✅ Friend request accepted:', friendData);
        // Refresh friends list
        fetchFriends();
      });

      return () => {
        socket.off('user_status_update');
        socket.off('online_users_update');
        socket.off('message_received');
        socket.off('friend_request_received');
        socket.off('friend_request_accepted');
      };
    }
  }, [socket, user._id]);

  // Update online status when onlineUsers changes
  useEffect(() => {
    if (onlineUsers.length > 0) {
      console.log('📱 Online users from context:', onlineUsers);
      setFriends(prevFriends => 
        prevFriends.map(u => ({
          ...u,
          isOnline: onlineUsers.includes(u._id)
        }))
      );
    }
  }, [onlineUsers]);

  const fetchFriends = async () => {
    try {
      console.log('🔍 Fetching friends list...');
      const response = await usersAPI.getFriends();
      console.log('✅ Friends data:', response.data);
      
      // Set initial online status based on onlineUsers context
      const friendsWithStatus = response.data.map(friend => ({
        ...friend,
        isOnline: onlineUsers.includes(friend._id) || friend.isOnline || false
      }));
      
      setFriends(friendsWithStatus);
      console.log('👥 Friends with status:', friendsWithStatus);
      
      // Fetch unread counts for each friend
      await fetchUnreadCounts(friendsWithStatus);
    } catch (error) {
      console.error('❌ Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async (friendsList) => {
    try {
      const unreadData = {};

      // Fetch unread count for each friend using the updated API
      for (const friend of friendsList) {
        try {
          const response = await messagesAPI.getConversation(friend._id);
          
          if (response.data) {
            // Count unread messages where current user is receiver
            const unreadCount = response.data.messages.filter(msg => 
              msg.receiver._id === user._id && !msg.isRead
            ).length;
            
            if (unreadCount > 0) {
              unreadData[friend._id] = unreadCount;
            }
          }
        } catch (error) {
          console.error(`Error fetching unread count for ${friend.username}:`, error);
        }
      }

      setUnreadCounts(unreadData);
      console.log('📊 Unread counts:', unreadData);
    } catch (error) {
      console.error('❌ Error fetching unread counts:', error);
    }
  };

  const updateUserStatus = (userId, isOnline, lastSeen = null) => {
    setFriends(prevFriends => 
      prevFriends.map(u => 
        u._id === userId 
          ? { 
              ...u, 
              isOnline: isOnline,
              lastSeen: lastSeen || u.lastSeen
            }
          : u
      )
    );
  };

  const isUserOnline = (userId) => {
    const userInList = friends.find(u => u._id === userId);
    const isInOnlineUsers = onlineUsers.includes(userId);
    const userOnlineStatus = userInList?.isOnline || false;
    
    return isInOnlineUsers || userOnlineStatus;
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getOnlineCount = () => {
    return friends.filter(u => isUserOnline(u._id)).length;
  };

  const handleUserSelect = (friend) => {
    // Clear unread count when user is selected
    setUnreadCounts(prev => ({
      ...prev,
      [friend._id]: 0
    }));
    
    // Mark messages as read
    markMessagesAsRead(friend._id);
    
    onUserSelect(friend);
  };

  const markMessagesAsRead = async (userId) => {
    try {
      await messagesAPI.markAsRead(userId);
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  };

  // Sort friends: unread messages first, then online users, then by last seen
  const getSortedFriends = () => {
    return [...friends].sort((a, b) => {
      const aUnread = unreadCounts[a._id] || 0;
      const bUnread = unreadCounts[b._id] || 0;
      const aOnline = isUserOnline(a._id);
      const bOnline = isUserOnline(b._id);

      // First priority: unread messages
      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;
      if (aUnread > 0 && bUnread > 0) return bUnread - aUnread; // More unread messages first

      // Second priority: online status
      if (aOnline && !bOnline) return -1;
      if (bOnline && !aOnline) return 1;

      // Third priority: last seen (for offline users)
      if (!aOnline && !bOnline) {
        const aLastSeen = new Date(a.lastSeen || 0);
        const bLastSeen = new Date(b.lastSeen || 0);
        return bLastSeen - aLastSeen;
      }

      // Finally, alphabetical order
      return a.username.localeCompare(b.username);
    });
  };

  const handleFriendAdded = () => {
    // Refresh friends list when a new friend is added
    fetchFriends();
  };

  const handleFriendRemoved = (friendId) => {
    // Remove friend from local state
    setFriends(prevFriends => prevFriends.filter(f => f._id !== friendId));
    
    // Clear unread count for removed friend
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[friendId];
      return newCounts;
    });
    
    // If removed friend was selected, clear selection
    if (selectedUser?._id === friendId) {
      onUserSelect(null);
    }
  };

  if (loading) {
    return (
      <div className="user-list">
        <div className="user-list-header">
          <h3>Chats</h3>
          {onMobileClose && (
            <button 
              className="mobile-close-btn"
              onClick={onMobileClose}
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
        <div className="loading-users">
          <div className="loading-spinner"></div>
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  const sortedFriends = getSortedFriends();

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Chats</h3>
        <div className="header-actions">
          <button 
            className="friend-requests-btn"
            onClick={() => setShowFriendRequests(true)}
            title="Friend Requests"
          >
            👥
          </button>
          <button 
            className="add-friend-btn"
            onClick={() => setShowUserSearch(true)}
            title="Add Friends"
          >
            ➕
          </button>
          {onMobileClose && (
            <button 
              className="mobile-close-btn"
              onClick={onMobileClose}
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {friends.length > 0 && (
        <div className="online-count">
          {getOnlineCount()} online
        </div>
      )}

      <div className="users-container">
        {sortedFriends.length === 0 ? (
          <div className="no-friends">
            <div className="no-friends-content">
              <h4>No friends yet</h4>
              <p>Add friends to start chatting</p>
              <button 
                className="add-friends-cta"
                onClick={() => setShowUserSearch(true)}
              >
                Add Friends
              </button>
            </div>
          </div>
        ) : (
          sortedFriends.map(friend => {
            const userOnline = isUserOnline(friend._id);
            const unreadCount = unreadCounts[friend._id] || 0;
            
            return (
              <div
                key={friend._id}
                className={`user-item ${selectedUser?._id === friend._id ? 'selected' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => handleUserSelect(friend)}
              >
                <div className="user-avatar">
                  <img 
                    src={friend.avatar || '/default-avatar.png'} 
                    alt={friend.username}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${friend.username}&background=random`;
                    }}
                  />
                  <div className={`status-indicator ${userOnline ? 'online' : 'offline'}`}>
                  </div>
                </div>

                <div className="user-info">
                  <div className="user-name-container">
                    <div className="user-name">{friend.username}</div>
                    {unreadCount > 0 && (
                      <div className="unread-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="user-status">
                    {userOnline ? (
                      <span className="online-text">Online</span>
                    ) : (
                      <span className="offline-text">
                        Last seen {formatLastSeen(friend.lastSeen)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Friend Requests Modal */}
      {showFriendRequests && (
        <FriendRequests 
          onClose={() => setShowFriendRequests(false)}
          onFriendAdded={handleFriendAdded}
        />
      )}

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearch 
          onClose={() => setShowUserSearch(false)}
          onFriendAdded={handleFriendAdded}
        />
      )}
    </div>
  );
};

export default UserList;