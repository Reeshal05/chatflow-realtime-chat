import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import './MessageList.css';

const MessageList = ({ selectedUser }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  // ✅ ENHANCED: Real-time message handling with delivery status
  useEffect(() => {
    if (socket && selectedUser && user) {
      console.log('🔗 Setting up socket listeners for conversation with:', selectedUser.username);
      
      // Handle incoming messages
      const handleMessageReceived = (messageData) => {
        console.log('📨 Message received via socket:', messageData);
        
        const messages = Array.isArray(messageData) ? messageData : [messageData];
        
        messages.forEach(message => {
          const currentUserId = user?._id || user?.id;
          
          const isRelevantMessage = (
            (message.sender?._id === selectedUser?._id && message.receiver?._id === currentUserId) ||
            (message.sender?._id === currentUserId && message.receiver?._id === selectedUser?._id)
          );

          if (isRelevantMessage) {
            setMessages(prev => {
              const messageExists = prev.some(msg => 
                msg._id === message._id || 
                (msg.tempId && msg.tempId === message.tempId)
              );
              
              if (!messageExists) {
                console.log('✅ Adding new message to chat');
                
                // ✅ NEW: Auto-mark as read if message is for current user and chat is active
                if (message.receiver?._id === currentUserId && socket) {
                  setTimeout(() => {
                    socket.emit('messageRead', { messageId: message._id });
                  }, 500); // Small delay to simulate reading
                }
                
                return [...prev, message];
              }
              return prev;
            });
          }
        });
      };

      // ✅ NEW: Handle message delivery confirmations
      const handleMessageDelivered = (data) => {
        console.log('✅ Message delivered:', data);
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, status: 'delivered', deliveredAt: data.deliveredAt }
            : msg
        ));
      };

      // ✅ NEW: Handle message read confirmations
      const handleMessageRead = (data) => {
        console.log('✅ Message read:', data);
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, status: 'read', readAt: data.readAt, deliveredAt: data.deliveredAt }
            : msg
        ));
      };

      // ✅ NEW: Handle conversation read (bulk read)
      const handleConversationRead = (data) => {
        console.log('✅ Conversation read:', data);
        setMessages(prev => prev.map(msg => 
          data.messageIds.includes(msg._id)
            ? { ...msg, status: 'read', readAt: data.readAt }
            : msg
        ));
      };

      // Handle typing indicators
      const handleTypingIndicator = (data) => {
        console.log('⌨️ Typing indicator received:', data);
        
        if (data.userId === selectedUser._id) {
          setTypingUsers(prev => {
            if (data.isTyping) {
              const userAlreadyTyping = prev.some(u => u.userId === data.userId);
              if (!userAlreadyTyping) {
                return [...prev, { userId: data.userId, username: data.username }];
              }
              return prev;
            } else {
              return prev.filter(u => u.userId !== data.userId);
            }
          });
        }
      };

      // Handle message sent confirmation
      const handleMessageSent = (data) => {
        console.log('✅ Message sent confirmation:', data);
        
        if (data.tempId) {
          setMessages(prev => prev.map(msg => 
            msg.tempId === data.tempId 
              ? { 
                  ...msg, 
                  _id: data._id, 
                  createdAt: data.createdAt, 
                  status: data.status,
                  sentAt: data.sentAt,
                  deliveredAt: data.deliveredAt
                }
              : msg
          ));
        }
      };

      // Handle message errors
      const handleMessageError = (error) => {
        console.error('❌ Message error:', error);
        
        if (error.tempId) {
          setMessages(prev => prev.map(msg => 
            msg.tempId === error.tempId 
              ? { ...msg, status: 'failed', error: error.message }
              : msg
          ));
        }
      };

      // ✅ NEW: Socket event listeners with delivery status
      socket.on('message_received', handleMessageReceived);
      socket.on('messageDelivered', handleMessageDelivered);
      socket.on('messageRead', handleMessageRead);
      socket.on('conversationRead', handleConversationRead);
      socket.on('userTyping', handleTypingIndicator);
      socket.on('messageSent', handleMessageSent);
      socket.on('messageError', handleMessageError);

      // ✅ NEW: Mark conversation as read when user opens chat
      if (selectedUser) {
        socket.emit('markConversationRead', { senderId: selectedUser._id });
      }

      // Cleanup function
      return () => {
        socket.off('message_received', handleMessageReceived);
        socket.off('messageDelivered', handleMessageDelivered);
        socket.off('messageRead', handleMessageRead);
        socket.off('conversationRead', handleConversationRead);
        socket.off('userTyping', handleTypingIndicator);
        socket.off('messageSent', handleMessageSent);
        socket.off('messageError', handleMessageError);
        console.log('🧹 Cleaned up socket listeners');
      };
    }
  }, [socket, selectedUser, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ NEW: Auto-scroll when typing indicator changes
  useEffect(() => {
    scrollToBottom();
  }, [typingUsers]);

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/messages/conversation/${selectedUser._id}`;
      console.log('🔍 Fetching messages from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📨 Messages fetched:', data.messages?.length || 0);
        setMessages(data.messages || []);
        
        // ✅ NEW: Auto-mark conversation as read when loading
        if (socket && selectedUser) {
          setTimeout(() => {
            socket.emit('markConversationRead', { senderId: selectedUser._id });
          }, 1000);
        }
      } else {
        console.error('❌ Error fetching messages:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (message) => {
    const timestamp = message.createdAt || message.timestamp;
    const messageDate = new Date(timestamp);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    if (!Array.isArray(messages)) {
      return {};
    }
    
    const groups = {};
    messages.forEach(message => {
      const timestamp = message.createdAt || message.timestamp;
      const date = new Date(timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const isMessageSentByMe = (message) => {
    if (!user || !message || !message.sender) {
      return false;
    }
    
    const currentUserId = user._id || user.id;
    const messageSenderId = message.sender._id || message.sender.id || message.sender;
    
    return String(currentUserId) === String(messageSenderId);
  };

  // ✅ NEW: Function to get status icon based on message status
  const getStatusIcon = (message) => {
    if (!isMessageSentByMe(message)) return null;
    
    switch (message.status) {
      case 'sending':
        return <span className="status-sending" title="Sending...">⏳</span>;
      case 'sent':
        return <span className="status-sent" title="Sent">✓</span>;
      case 'delivered':
        return <span className="status-delivered" title="Delivered">✓✓</span>;
      case 'read':
        return <span className="status-read" title="Read">✓✓</span>;
      case 'failed':
        return <span className="status-failed" title="Failed to send">❌</span>;
      default:
        return <span className="status-sent" title="Sent">✓</span>;
    }
  };

  if (!selectedUser) {
    return (
      <div className="message-list no-chat">
        <div className="welcome-message">
          <h2>Welcome to ChatFlow</h2>
          <p>Select a user from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="message-list">
        <div className="loading-messages">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="message-list">
      <div className="messages-container">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.keys(groupedMessages).map(date => (
            <div key={date} className="message-group">
              <div className="date-header">
                <span>{formatDateHeader(date)}</span>
              </div>
              {groupedMessages[date].map(message => {
                const isSentByMe = isMessageSentByMe(message);
                const messageStatus = message.status || 'sent';
                const messageClass = isSentByMe ? 'sent' : 'received';
                
                return (
                  <div
                    key={message._id || message.tempId}
                    className={`message ${messageClass} ${messageStatus}`}
                  >
                    <div className="message-content">
                      <p>{message.content}</p>
                      <div className="message-meta">
                        <span className="message-time">
                          {formatMessageTime(message)}
                        </span>
                        {/* ✅ NEW: Enhanced status display */}
                        <div className="message-status">
                          {getStatusIcon(message)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-bubble">
              <span>{typingUsers[0].username} is typing</span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;