// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  // ✅ NEW: Enhanced status tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  // ✅ NEW: Detailed timestamps for each status
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  // ✅ KEEP: Legacy field for backward compatibility
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ✅ NEW: Pre-save middleware to sync isRead with status
messageSchema.pre('save', function(next) {
  if (this.status === 'read') {
    this.isRead = true;
    if (!this.readAt) {
      this.readAt = new Date();
    }
  }
  next();
});

// ✅ NEW: Method to update message status
messageSchema.methods.updateStatus = function(newStatus) {
  const now = new Date();
  
  switch(newStatus) {
    case 'delivered':
      if (this.status === 'sent') {
        this.status = 'delivered';
        this.deliveredAt = now;
      }
      break;
    case 'read':
      if (this.status === 'sent' || this.status === 'delivered') {
        this.status = 'read';
        this.readAt = now;
        this.isRead = true;
        if (!this.deliveredAt) {
          this.deliveredAt = now; // Auto-mark as delivered when read
        }
      }
      break;
  }
  
  return this.save();
};

// Index for efficient querying
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ status: 1 }); // ✅ NEW: Index for status queries

module.exports = mongoose.model('Message', messageSchema);