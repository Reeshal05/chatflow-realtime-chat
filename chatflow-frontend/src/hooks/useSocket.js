//hooks./useSocket.js
import { useContext, useEffect, useState, useCallback } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Custom hook for message handling
export const useMessages = (selectedUser) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  // Fetch messages when user changes
  useEffect(() => {
    if (selectedUser && user) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedUser, user]);

  // Listen for real-time messages
  useEffect(() => {
    if (socket && selectedUser && user) {
      const handleNewMessage = (message) => {
        // Only add message if it's part of current conversation
        if (
          (message.sender._id === selectedUser._id && message.receiver._id === user._id) ||
          (message.sender._id === user._id && message.receiver._id === selectedUser._id)
        ) {
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg => msg._id === message._id);
            if (!messageExists) {
              return [...prev, message];
            }
            return prev;
          });
        }
      };

      socket.on('message_received', handleNewMessage);

      return () => {
        socket.off('message_received', handleNewMessage);
      };
    }
  }, [socket, selectedUser, user]);

  const fetchMessages = useCallback(async () => {
    if (!selectedUser || !user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/messages/${selectedUser._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data);
      } else {
        console.error('Error fetching messages:', data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUser, user]);

  return {
    messages,
    loading,
    refetch: fetchMessages
  };
};

// Custom hook for typing indicators
export const useTyping = (selectedUser) => {
  const { socket } = useSocket();
  const { user } = useContext(AuthContext);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (socket && selectedUser && user) {
      const handleTypingIndicator = ({ userId, username, isTyping: typing }) => {
        if (userId === selectedUser._id) {
          setTypingUsers(prev => 
            typing 
              ? [...prev.filter(u => u.userId !== userId), { userId, username }]
              : prev.filter(u => u.userId !== userId)
          );
        }
      };

      socket.on('typing_indicator', handleTypingIndicator);

      return () => {
        socket.off('typing_indicator', handleTypingIndicator);
      };
    }
  }, [socket, selectedUser, user]);

  const startTyping = useCallback(() => {
    if (socket && !isTyping && selectedUser && user) {
      setIsTyping(true);
      socket.emit('typing_start', {
        receiverId: selectedUser._id,
        userId: user._id,
        username: user.username
      });
    }
  }, [socket, isTyping, selectedUser, user]);

  const stopTyping = useCallback(() => {
    if (socket && isTyping && selectedUser && user) {
      setIsTyping(false);
      socket.emit('typing_stop', {
        receiverId: selectedUser._id,
        userId: user._id,
        username: user.username
      });
    }
  }, [socket, isTyping, selectedUser, user]);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping
  };
};

// Custom hook for online users
export const useOnlineUsers = () => {
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const url = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/users`;
    const token = localStorage.getItem('token');
    
    console.log('🔍 Fetching users from:', url);
    console.log('🔑 Token exists:', !!token);
    console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('📊 Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('✅ Users data:', data);
        
        if (response.ok) {
          setUsers(data);
        } else {
          console.error('❌ API Error:', data.message || data);
        }
      } else {
        // If not JSON, log the actual response
        const text = await response.text();
        console.error('❌ Expected JSON but got:', text.substring(0, 200) + '...');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  return {
    users,
    onlineUsers,
    isUserOnline,
    refetch: fetchUsers,
    loading
  };
};

// Custom hook for sending messages
export const useSendMessage = (selectedUser) => {
  const { socket } = useSocket();
  const { user } = useContext(AuthContext);
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(async (content, messageType = 'text') => {
    if (!selectedUser || !content.trim() || sending || !user) return null;

    setSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiverId: selectedUser._id,
          content: content.trim(),
          messageType
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Emit message through socket for real-time delivery
        if (socket && socket.connected) {
          socket.emit('send_message', {
            receiverId: selectedUser._id,
            message: data
          });
        }
        return data;
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [selectedUser, sending, user, socket]);

  return {
    sendMessage,
    sending
  };
};