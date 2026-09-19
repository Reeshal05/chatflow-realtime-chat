// backend/routes/room.js
const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// Get all rooms that user is part of
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      participants: req.user.id
    })
    .populate('participants', 'username email isOnline')
    .populate('createdBy', 'username email')
    .sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public rooms (not joined by user)
router.get('/public', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      isPrivate: false,
      participants: { $ne: req.user.id }
    })
    .populate('createdBy', 'username email')
    .select('name description participants createdBy createdAt')
    .sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching public rooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new room
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPrivate = false } = req.body;
    
    // Check if room name already exists
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room name already exists' });
    }
    
    const room = new Room({
      name,
      description,
      participants: [req.user.id],
      createdBy: req.user.id,
      isPrivate
    });
    
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('participants', 'username email isOnline')
      .populate('createdBy', 'username email');
    
    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room
router.post('/:roomId/join', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is already in room
    if (room.participants.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already in room' });
    }
    
    room.participants.push(req.user.id);
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('participants', 'username email isOnline')
      .populate('createdBy', 'username email');
    
    res.json(populatedRoom);
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a room
router.post('/:roomId/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    room.participants = room.participants.filter(
      participant => participant.toString() !== req.user.id
    );
    
    // If room is empty, delete it (unless it's created by someone else)
    if (room.participants.length === 0 && room.createdBy.toString() === req.user.id) {
      await Room.findByIdAndDelete(req.params.roomId);
      return res.json({ message: 'Room deleted' });
    }
    
    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room details
router.get('/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('participants', 'username email isOnline')
      .populate('createdBy', 'username email');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is part of the room
    if (!room.participants.some(participant => participant._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this room' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room details (only room creator can do this)
router.put('/:roomId', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this room' });
    }
    
    room.name = name || room.name;
    room.description = description || room.description;
    
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('participants', 'username email isOnline')
      .populate('createdBy', 'username email');
    
    res.json(populatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;