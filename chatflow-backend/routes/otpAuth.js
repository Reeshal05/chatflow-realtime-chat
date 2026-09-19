// backend/routes/otpAuth.js - FIXED VERSION
const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../config/firebase');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../config/email');
const router = express.Router();

// Step 1: Send OTP to email
router.post('/send-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('username').isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    // Check if user already exists in main User collection
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if user already exists in PendingUser collection
    const existingPendingUser = await PendingUser.findOne({ $or: [{ email }, { username }] });
    if (existingPendingUser) {
      // Delete existing pending user to allow retry
      await PendingUser.findByIdAndDelete(existingPendingUser._id);
      // Also delete from Firebase if exists
      try {
        await auth.deleteUser(existingPendingUser.firebaseUid);
      } catch (firebaseError) {
        console.log('Firebase user not found or already deleted:', firebaseError.message);
      }
    }

    // Create user in Firebase Auth
    const firebaseUser = await auth.createUser({
      email: email,
      emailVerified: false,
      disabled: false,
    });

    // Store user data temporarily in PendingUser collection
    const pendingUser = new PendingUser({
      username,
      email,
      password,
      firebaseUid: firebaseUser.uid,
    });

    await pendingUser.save();

    // CHANGED: Generate custom verification link that goes directly to your app
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email?uid=${firebaseUser.uid}`,
      handleCodeInApp: false, // Changed to false
    };

    const emailVerificationLink = await auth.generateEmailVerificationLink(
      email,
      actionCodeSettings
    );

    // Send the email
    const emailResult = await sendVerificationEmail(email, emailVerificationLink);
    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      // Continue anyway, but log the error
    }

    res.json({
      message: 'Verification email sent successfully',
      verificationLink: emailVerificationLink, // Remove this in production
      firebaseUid: firebaseUser.uid,
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Step 2: Verify email and complete registration
router.post('/verify-email', [
  body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firebaseUid } = req.body;

    // Find pending user
    const pendingUser = await PendingUser.findOne({ firebaseUid });
    if (!pendingUser) {
      return res.status(400).json({ message: 'Invalid verification request' });
    }

    // Check if email is verified in Firebase
    const firebaseUser = await auth.getUser(firebaseUid);
    if (!firebaseUser.emailVerified) {
      return res.status(400).json({ message: 'Email not verified yet' });
    }

    // Create user in main User collection
    const user = new User({
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password, // Already hashed in PendingUser
      isOnline: true,
    });

    await user.save();

    // Delete pending user
    await PendingUser.findByIdAndDelete(pendingUser._id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme,
        notifications: user.notifications,
        isOnline: user.isOnline
      }
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper route to check verification status
router.get('/check-verification/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    // Check Firebase user
    const firebaseUser = await auth.getUser(firebaseUid);
    
    // Check if pending user exists
    const pendingUser = await PendingUser.findOne({ firebaseUid });
    
    res.json({
      emailVerified: firebaseUser.emailVerified,
      pendingUserExists: !!pendingUser,
      email: firebaseUser.email
    });

  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend verification email
router.post('/resend-verification', [
  body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firebaseUid } = req.body;

    // Find pending user
    const pendingUser = await PendingUser.findOne({ firebaseUid });
    if (!pendingUser) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // CHANGED: Generate custom verification link that goes directly to your app
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email?uid=${firebaseUid}`,
      handleCodeInApp: false, // Changed to false
    };

    const emailVerificationLink = await auth.generateEmailVerificationLink(
      pendingUser.email,
      actionCodeSettings
    );

    // Send the email
    const emailResult = await sendVerificationEmail(pendingUser.email, emailVerificationLink);
    if (!emailResult.success) {
      console.error('Failed to resend email:', emailResult.error);
    }

    res.json({
      message: 'Verification email resent successfully',
      verificationLink: emailVerificationLink, // Remove this in production
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;