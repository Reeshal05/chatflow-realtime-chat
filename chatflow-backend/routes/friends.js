// routes/friends.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user's friends
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const friends = await FriendRequest.getUserFriends(userId);
    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search for users (to send friend requests)
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    // Search for users by username or email
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email avatar isOnline lastSeen')
    .limit(20);
    
    // For each user, check friendship status
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const existingRequest = await FriendRequest.findOne({
          $or: [
            { requester: currentUserId, recipient: user._id },
            { requester: user._id, recipient: currentUserId }
          ]
        });
        
        let relationshipStatus = 'none';
        if (existingRequest) {
          if (existingRequest.status === 'accepted') {
            relationshipStatus = 'friends';
          } else if (existingRequest.status === 'pending') {
            relationshipStatus = existingRequest.requester.toString() === currentUserId.toString() 
              ? 'request_sent' 
              : 'request_received';
          }
        }
        
        return {
          ...user.toObject(),
          relationshipStatus
        };
      })
    );
    
    res.json(usersWithStatus);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send friend request
router.post('/request', auth, [
  body('recipientId').isMongoId().withMessage('Valid recipient ID required'),
  body('message').optional().isLength({ max: 200 }).withMessage('Message must be 200 characters or less')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { recipientId, message = '' } = req.body;
    const requesterId = req.user._id;
    
    // Check if trying to send request to self
    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if they're already friends or have pending request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });
    
    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends' });
      } else if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'Friend request already exists' });
      }
    }
    
    // Create friend request
    const friendRequest = new FriendRequest({
      requester: requesterId,
      recipient: recipientId,
      message: message.trim()
    });
    
    await friendRequest.save();
    
    // Populate requester info for response
    await friendRequest.populate('requester', 'username email avatar');
    
    res.status(201).json({
      message: 'Friend request sent successfully',
      request: friendRequest
    });
    
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending friend requests (received)
router.get('/requests/received', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const requests = await FriendRequest.find({
      recipient: userId,
      status: 'pending'
    })
    .populate('requester', 'username email avatar isOnline lastSeen')
    .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sent friend requests
router.get('/requests/sent', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const requests = await FriendRequest.find({
      requester: userId,
      status: 'pending'
    })
    .populate('recipient', 'username email avatar isOnline lastSeen')
    .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.put('/request/:requestId/accept', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    
    const request = await FriendRequest.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    }).populate('requester', 'username email avatar');
    
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Accept the request
    request.status = 'accepted';
    await request.save();
    
    res.json({
      message: 'Friend request accepted',
      request
    });
    
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject friend request
router.put('/request/:requestId/reject', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    
    const request = await FriendRequest.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Reject the request
    request.status = 'rejected';
    await request.save();
    
    res.json({
      message: 'Friend request rejected'
    });
    
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove friend
router.delete('/remove/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;
    
    const friendship = await FriendRequest.findOne({
      $or: [
        { requester: userId, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: userId, status: 'accepted' }
      ]
    });
    
    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }
    
    // Remove the friendship
    await FriendRequest.deleteOne({ _id: friendship._id });
    
    res.json({
      message: 'Friend removed successfully'
    });
    
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;