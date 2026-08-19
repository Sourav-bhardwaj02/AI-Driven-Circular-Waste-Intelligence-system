const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, profile, authCode } = req.body;

    // Validation
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Strong authorization logic for Identifier / Admin
    if (role === 'identifier') {
      const validIdentifierCodes = ['IDENTIFIER-2026', 'TACO-VERIFY', 'WASTEWISE-ID', 'MCD-IDENTIFIER'];
      if (!authCode || !validIdentifierCodes.includes(authCode.trim().toUpperCase())) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Identifier Authorization Passcode. Authorized identifier access required.'
        });
      }
    } else if (role === 'admin') {
      const validAdminCodes = ['MCD-ADMIN-2026', 'ADMIN-ROOT-2026', 'WASTEWISE-ADMIN'];
      if (!authCode || !validAdminCodes.includes(authCode.trim().toUpperCase())) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Administrator Security Key.'
        });
      }
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Build profile with auto-generated badge if identifier
    const userProfile = {
      ...(profile || {}),
      badgeNumber: profile?.badgeNumber || (role === 'identifier' ? `ID-${Math.floor(1000 + Math.random() * 9000)}` : undefined)
    };

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      profile: userProfile,
      rewardPoints: role === 'citizen' ? 0 : 500,
      level: role === 'identifier' ? 5 : 1,
      isVerified: true
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} registered successfully`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
          rewardPoints: user.rewardPoints,
          level: user.level
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Role check: if role is specified, verify it matches
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account role is '${user.role}', but tried logging in as '${role}'`
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
          rewardPoints: user.rewardPoints,
          level: user.level
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
          rewardPoints: user.rewardPoints,
          level: user.level
        }
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
