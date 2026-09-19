// backend/models/PendingUser.js - FIXED VERSION
const mongoose = require('mongoose');
// Remove bcrypt import - not needed anymore
// const bcrypt = require('bcryptjs');

const pendingUserSchema = new mongoose.Schema({
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
    // Store as plain text - User model will hash it
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Document expires after 1 hour
  }
});

// REMOVED: Password hashing pre('save') middleware
// This prevents double hashing - let User model handle it

module.exports = mongoose.model('PendingUser', pendingUserSchema);