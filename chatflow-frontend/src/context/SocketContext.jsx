import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const { user } = useContext(AuthContext);

  const connectSocket = useCallback(() => {
    if (user && !socket) {
      console.log('🔗 Creating new socket connection for user:', user.username);
      
      const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        },
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Connected to server with socket ID:', newSocket.id);
        setConnectionStatus('connected');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server. Reason:', reason);
        setConnectionStatus('disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setConnectionStatus('error');
      });

      // Handle authentication errors
      newSocket.on('authError', (error) => {
        console.error('❌ Authentication error:', error);
        localStorage.removeItem('token');
        setConnectionStatus('auth_error');
      });

      // ✅ FIXED: Online users updates
      newSocket.on('onlineUsers', (users) => {
        console.log('👥 Online users updated:', users);
        setOnlineUsers(users || []);
      });

      // General error handling
      newSocket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      // Reconnection handlers
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('✅ Reconnected after', attemptNumber, 'attempts');
        setConnectionStatus('connected');
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection failed:', error);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed completely');
        setConnectionStatus('reconnect_failed');
      });

      // Debug: Log socket events in development
      if (process.env.NODE_ENV === 'development') {
        newSocket.onAny((event, ...args) => {
          console.log(`🔊 Socket event: ${event}`, args);
        });
      }

      setSocket(newSocket);
    }
  }, [user, socket]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      console.log('🔌 Disconnecting socket for user:', user?.username);
      socket.disconnect();
      setSocket(null);
      setOnlineUsers([]);
      setConnectionStatus('disconnected');
    }
  }, [socket, user]);

  // ✅ REMOVED: sendMessage, startTyping, stopTyping functions
  // Components should emit socket events directly using socket.emit()
  // This reduces complexity and prevents event name mismatches

  // Auto-connect when user logs in
  useEffect(() => {
    if (user && !socket) {
      connectSocket();
    }
  }, [user, connectSocket]);

  // Auto-disconnect when user logs out
  useEffect(() => {
    if (!user && socket) {
      disconnectSocket();
    }
  }, [user, socket, disconnectSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        console.log('🧹 Cleaning up socket connection');
        socket.disconnect();
      }
    };
  }, [socket]);

  const value = {
    socket,
    onlineUsers,
    connectionStatus,
    connectSocket,
    disconnectSocket,
    isConnected: socket?.connected || false
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext };