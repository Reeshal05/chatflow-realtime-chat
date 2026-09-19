// routes/users.js - Updated version
const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Message = require('../models/Message')

const router = express.Router();

// Get user's friends only (updated from get all users)
router.get('/', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Get user's friends using the FriendRequest model
    const friends = await FriendRequest.getUserFriends(currentUserId);
    
    // Sort friends by username
    const sortedFriends = friends.sort((a, b) => a.username.localeCompare(b.username));
    
    res.json(sortedFriends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('username').optional().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('theme').optional().isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
  body('notifications').optional().isBoolean().withMessage('Notifications must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, avatar, theme, notifications } = req.body;
    const userId = req.user._id;

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: userId } },
          { $or: [
            username ? { username } : null,
            email ? { email } : null
          ].filter(Boolean) }
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username or email already exists' 
        });
      }
    }

    // Update user
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (theme) updateData.theme = theme;
    if (notifications !== undefined) updateData.notifications = notifications;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update online status
router.put('/status', auth, async (req, res) => {
  try {
    const { isOnline } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        isOnline,
        lastSeen: isOnline ? new Date() : new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user profile 
router.delete('/profile', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Start a transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Delete all messages sent by the user
      await Message.deleteMany({ sender: userId }, { session });
      
      // 2. Delete all messages received by the user
      await Message.deleteMany({ receiver: userId }, { session });
      
      // 3. Delete all friend requests where user is requester
      await FriendRequest.deleteMany({ requester: userId }, { session });
      
      // 4. Delete all friend requests where user is recipient
      await FriendRequest.deleteMany({ recipient: userId }, { session });
      
      // 5. Update user's online status to false before deletion
      await User.findByIdAndUpdate(userId, { isOnline: false }, { session });
      
      // 6. Delete the user account
      const deletedUser = await User.findByIdAndDelete(userId, { session });
      
      if (!deletedUser) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      res.json({ 
        message: 'Profile deleted successfully',
        deletedUser: {
          id: deletedUser._id,
          username: deletedUser.username,
          email: deletedUser.email
        }
      });
      
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ 
      message: 'Failed to delete profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

module.exports = router;