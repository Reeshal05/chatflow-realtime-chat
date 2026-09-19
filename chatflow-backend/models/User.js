// models/User.js - Updated version
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  avatar: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  notifications: {
    type: Boolean,
    default: true
  },
  // NEW: Friends array (will be populated dynamically via FriendRequest model)
  // We don't store friends directly in User model to avoid duplication
  // Instead, we'll use the FriendRequest model to manage relationships
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// NEW: Method to get user's friends
userSchema.methods.getFriends = async function() {
  const FriendRequest = require('./FriendRequest');
  return await FriendRequest.getUserFriends(this._id);
};

// NEW: Method to check if user is friends with another user
userSchema.methods.isFriendsWith = async function(userId) {
  const FriendRequest = require('./FriendRequest');
  return await FriendRequest.areUsersFriends(this._id, userId);
};

module.exports = mongoose.model('User', userSchema);