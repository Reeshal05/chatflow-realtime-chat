import React, { useState, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import './MessageInput.css';

const MessageInput = ({ selectedUser, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const handleTyping = () => {
    if (!isTyping && socket && selectedUser) {
      setIsTyping(true);
      
      // ✅ FIXED: Only emit the correct event name that backend handles
      socket.emit('typing', { 
        receiverId: selectedUser._id, 
        userId: user._id, 
        username: user.username 
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && socket && selectedUser) {
        setIsTyping(false);
        
        // ✅ FIXED: Only emit the correct event name
        socket.emit('stopTyping', { 
          receiverId: selectedUser._id, 
          userId: user._id, 
          username: user.username 
        });
      }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || sending || !selectedUser) return;

    // Stop typing indicator
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit('stopTyping', { 
        receiverId: selectedUser._id, 
        userId: user._id, 
        username: user.username 
      });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    setSending(true);
    const messageContent = message.trim();
    const tempId = Date.now();

    try {
      // Clear input immediately for better UX
      setMessage('');
      
      // ✅ CRITICAL FIX: Send message ONLY via Socket.io (not HTTP API)
      // The backend will handle database storage
      if (socket && socket.connected) {
        const socketData = {
          receiverId: selectedUser._id,
          content: messageContent,
          messageType: 'text',
          tempId: tempId
        };
        
        // ✅ FIXED: Only emit the correct event name that backend handles
        socket.emit('sendMessage', socketData);
        
        console.log('📤 Message sent via Socket.io:', socketData);
        
        // Call callback if provided
        if (onMessageSent) {
          onMessageSent({
            tempId,
            content: messageContent,
            sender: user,
            receiver: selectedUser,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        throw new Error('Socket not connected');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Restore message if sending failed
      setMessage(messageContent);
      
      // Show error to user
      alert('Failed to send message. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${selectedUser.username}...`}
            disabled={sending}
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
              resize: 'none',
              overflow: 'hidden'
            }}
            onInput={(e) => {
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="send-button"
          >
            {sending ? (
              <div className="sending-spinner"></div>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 21L23 12L2 3V10L17 12L2 14V21Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
      
      {/* Debug info - remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '60px', 
          right: '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px', 
          fontSize: '12px',
          zIndex: 1000
        }}>
          <div>Socket Connected: {socket?.connected ? '✅' : '❌'}</div>
          <div>Sending: {sending ? '✅' : '❌'}</div>
          <div>Selected User: {selectedUser?.username}</div>
          <div>Is Typing: {isTyping ? '✅' : '❌'}</div>
        </div>
      )} */}
    </div>
  );
};

export default MessageInput;