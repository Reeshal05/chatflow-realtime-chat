// socket/socketHandlers.js
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Store online users with their socket IDs
const onlineUsers = new Map();

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io) => {
  // Socket authentication middleware
  io.use(socketAuth);
  
  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.user.username} connected with socket ID: ${socket.id}`);
    
    // Add user to online users
    onlineUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      userId: socket.user._id,
      username: socket.user.username
    });
    
    // Update user online status
    User.findByIdAndUpdate(socket.user._id, { isOnline: true }).exec();
    
    // Join user to their personal room
    socket.join(socket.user._id.toString());
    console.log(`👤 User ${socket.user.username} joined room: ${socket.user._id.toString()}`);
    
    // Broadcast online users to all clients
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
    
    // ✅ ENHANCED: Handle sending messages with delivery status
    socket.on('sendMessage', async (data) => {
      try {
        console.log('📤 Received sendMessage event:', data);
        const { receiverId, content, messageType = 'text' } = data;
        
        // Validate input
        if (!receiverId || !content?.trim()) {
          console.error('❌ Invalid message data:', data);
          return socket.emit('messageError', { 
            message: 'Invalid message data',
            tempId: data.tempId 
          });
        }
        
        // Create message in database with 'sent' status
        const message = new Message({
          sender: socket.user._id,
          receiver: receiverId,
          content: content.trim(),
          messageType,
          status: 'sent',
          sentAt: new Date()
        });
        
        await message.save();
        await message.populate('sender', 'username');
        await message.populate('receiver', 'username');
        
        console.log('💾 Message saved to database:', message._id);
        
        // Prepare message data for sending
        const messageData = {
          _id: message._id,
          sender: {
            _id: message.sender._id,
            username: message.sender.username
          },
          receiver: {
            _id: message.receiver._id,
            username: message.receiver.username
          },
          content: message.content,
          messageType: message.messageType,
          status: message.status,
          sentAt: message.sentAt,
          deliveredAt: message.deliveredAt,
          readAt: message.readAt,
          createdAt: message.createdAt,
          isRead: message.isRead
        };
        
        // ✅ NEW: Check if receiver is online for delivery status
        const receiverOnline = onlineUsers.get(receiverId.toString());
        
        if (receiverOnline) {
          // Send to receiver's room
          console.log(`📨 Sending message to online receiver: ${receiverId}`);
          io.to(receiverId).emit('message_received', messageData);
          
          // ✅ NEW: Auto-mark as delivered since receiver is online
          message.status = 'delivered';
          message.deliveredAt = new Date();
          await message.save();
          
          // Update messageData with new status
          messageData.status = 'delivered';
          messageData.deliveredAt = message.deliveredAt;
          
          // ✅ NEW: Send delivery confirmation to sender
          socket.emit('messageDelivered', {
            messageId: message._id,
            deliveredAt: message.deliveredAt
          });
        } else {
          // Receiver is offline, message stays as 'sent'
          console.log(`📨 Receiver ${receiverId} is offline, message marked as sent only`);
        }
        
        // Send back to sender's room as well (for multi-device support)
        console.log(`📨 Sending message confirmation to sender room: ${socket.user._id.toString()}`);
        io.to(socket.user._id.toString()).emit('message_received', messageData);
        
        // ✅ ENHANCED: Confirm message sent to sender with status
        socket.emit('messageSent', {
          _id: message._id,
          tempId: data.tempId,
          createdAt: message.createdAt,
          status: message.status,
          sentAt: message.sentAt,
          deliveredAt: message.deliveredAt
        });
        
        console.log('✅ Message processing complete');
        
      } catch (error) {
        console.error('❌ Send message error:', error);
        socket.emit('messageError', { 
          message: 'Failed to send message',
          tempId: data.tempId,
          error: error.message
        });
      }
    });
    
    // ✅ NEW: Handle message delivery confirmation when user comes online
    socket.on('userOnline', async () => {
      try {
        // Mark undelivered messages as delivered
        const undeliveredMessages = await Message.find({
          receiver: socket.user._id,
          status: 'sent'
        });
        
        for (const message of undeliveredMessages) {
          message.status = 'delivered';
          message.deliveredAt = new Date();
          await message.save();
          
          // Notify sender about delivery
          const senderOnline = onlineUsers.get(message.sender.toString());
          if (senderOnline) {
            io.to(message.sender.toString()).emit('messageDelivered', {
              messageId: message._id,
              deliveredAt: message.deliveredAt
            });
          }
        }
        
        console.log(`✅ Marked ${undeliveredMessages.length} messages as delivered for ${socket.user.username}`);
      } catch (error) {
        console.error('❌ Error updating delivery status:', error);
      }
    });
    
    // ✅ ENHANCED: Handle message read receipts with status update
    socket.on('messageRead', async (data) => {
      try {
        const { messageId } = data;
        
        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit('messageError', { message: 'Message not found' });
        }
        
        // Only update if message is for this user and not already read
        if (message.receiver.toString() === socket.user._id.toString() && message.status !== 'read') {
          message.status = 'read';
          message.readAt = new Date();
          message.isRead = true;
          
          // Auto-mark as delivered if not already
          if (!message.deliveredAt) {
            message.deliveredAt = new Date();
          }
          
          await message.save();
          
          // Notify sender that message was read
          const senderOnline = onlineUsers.get(message.sender.toString());
          if (senderOnline) {
            io.to(message.sender.toString()).emit('messageRead', {
              messageId: messageId,
              readAt: message.readAt,
              deliveredAt: message.deliveredAt
            });
          }
          
          console.log(`✅ Message ${messageId} marked as read by ${socket.user.username}`);
        }
      } catch (error) {
        console.error('❌ Message read error:', error);
        socket.emit('messageError', { message: 'Failed to mark message as read' });
      }
    });
    
    // ✅ NEW: Bulk mark messages as read for a conversation
    socket.on('markConversationRead', async (data) => {
      try {
        const { senderId } = data;
        
        // Mark all unread messages from this sender as read
        const unreadMessages = await Message.find({
          sender: senderId,
          receiver: socket.user._id,
          status: { $ne: 'read' }
        });
        
        const messageIds = [];
        for (const message of unreadMessages) {
          message.status = 'read';
          message.readAt = new Date();
          message.isRead = true;
          
          if (!message.deliveredAt) {
            message.deliveredAt = new Date();
          }
          
          await message.save();
          messageIds.push(message._id);
        }
        
        // Notify sender about read receipts
        const senderOnline = onlineUsers.get(senderId.toString());
        if (senderOnline && messageIds.length > 0) {
          io.to(senderId.toString()).emit('conversationRead', {
            messageIds: messageIds,
            readAt: new Date(),
            readBy: socket.user._id
          });
        }
        
        console.log(`✅ Marked ${messageIds.length} messages as read for conversation with ${senderId}`);
      } catch (error) {
        console.error('❌ Mark conversation read error:', error);
      }
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      console.log('⌨️ User typing:', data);
      const { receiverId } = data;
      if (receiverId) {
        socket.to(receiverId).emit('userTyping', {
          userId: socket.user._id,
          username: socket.user.username,
          isTyping: true
        });
      }
    });
    
    socket.on('stopTyping', (data) => {
      console.log('⌨️ User stopped typing:', data);
      const { receiverId } = data;
      if (receiverId) {
        socket.to(receiverId).emit('userTyping', {
          userId: socket.user._id,
          username: socket.user.username,
          isTyping: false
        });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ User ${socket.user.username} disconnected. Reason: ${reason}`);
      
      // Remove from online users
      onlineUsers.delete(socket.user._id.toString());
      
      // Update user offline status
      User.findByIdAndUpdate(socket.user._id, { 
        isOnline: false, 
        lastSeen: new Date() 
      }).exec();
      
      // Broadcast updated online users
      io.emit('onlineUsers', Array.from(onlineUsers.values()));
    });
    
    // ✅ NEW: Emit userOnline event when user connects
    socket.emit('userOnline');
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      socket.onAny((event, ...args) => {
        console.log(`🔍 Socket event: ${event}`, args);
      });
    }
  });
};

module.exports = { handleConnection, onlineUsers };