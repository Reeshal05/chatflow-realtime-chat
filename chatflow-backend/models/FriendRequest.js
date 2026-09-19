// models/FriendRequest.js
const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 200,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient querying
friendRequestSchema.index({ requester: 1, recipient: 1 });
friendRequestSchema.index({ recipient: 1, status: 1 });
friendRequestSchema.index({ requester: 1, status: 1 });

// Ensure unique combination of requester and recipient
friendRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Static method to check if users are friends
friendRequestSchema.statics.areUsersFriends = async function(userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: 'accepted' },
      { requester: userId2, recipient: userId1, status: 'accepted' }
    ]
  });
  return !!friendship;
};

// Static method to get user's friends
friendRequestSchema.statics.getUserFriends = async function(userId) {
  const friendships = await this.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  }).populate('requester', 'username email avatar isOnline lastSeen')
    .populate('recipient', 'username email avatar isOnline lastSeen');

  // Extract friend objects
  const friends = friendships.map(friendship => {
    return friendship.requester._id.toString() === userId.toString() 
      ? friendship.recipient 
      : friendship.requester;
  });

  return friends;
};

// Method to update request status
friendRequestSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

module.exports = mongoose.model('FriendRequest', friendRequestSchema);