const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const WasteCollection = require('../models/WasteCollection');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get citizen dashboard data
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user || user.role !== 'citizen') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get recent reward transactions
    const recentTransactions = await RewardTransaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const recentPoints = recentTransactions.slice(0, 3).map(transaction => ({
      action: transaction.description,
      points: transaction.type === 'earned' ? `+${transaction.amount}` : `-${transaction.amount}`,
      time: getTimeAgo(transaction.createdAt)
    }));

    // Calculate level progress
    const currentLevel = user.level;
    const pointsForNextLevel = currentLevel * 1000;
    const progress = (user.rewardPoints % pointsForNextLevel) / pointsForNextLevel * 100;

    res.json({
      rewardPoints: user.rewardPoints,
      level: currentLevel,
      progress: Math.round(progress),
      recentPoints,
      nextLevelPoints: pointsForNextLevel
    });
  } catch (error) {
    console.error('Citizen dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report garbage/complaint
router.post('/report', upload.single('image'), async (req, res) => {
  try {
    const { citizenId, sector, description, latitude, longitude, priority } = req.body;

    const complaint = new Complaint({
      citizenId,
      sector,
      description,
      priority: priority || 'medium',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      image: req.file ? `/uploads/${req.file.filename}` : null
    });

    await complaint.save();

    // Award points for reporting
    await RewardTransaction.create({
      userId: citizenId,
      type: 'earned',
      amount: 15,
      description: 'Garbage Report',
      category: 'proper_disposal',
      referenceId: complaint._id,
      referenceModel: 'Complaint'
    });

    // Update user points
    await User.findByIdAndUpdate(citizenId, {
      $inc: { rewardPoints: 15 }
    });

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby trucks
router.get('/nearby-trucks/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find active routes near the user
    const nearbyRoutes = await Route.find({
      status: 'in_progress',
      'areas.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates
          },
          $maxDistance: 5000 // 5km radius
        }
      }
    }).populate('collectorId', 'username');

    // Simulate truck locations and ETAs
    const trucks = nearbyRoutes.map(route => ({
      routeCode: route.routeCode,
      collectorName: route.collectorId?.username,
      eta: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
      status: 'active'
    }));

    res.json({ trucks, nearestTruck: trucks[0] || null });
  } catch (error) {
    console.error('Nearby trucks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reward history
router.get('/rewards/:userId', async (req, res) => {
  try {
    const transactions = await RewardTransaction.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Redeem rewards
router.post('/redeem', async (req, res) => {
  try {
    const { userId, category, amount, description } = req.body;

    const user = await User.findById(userId);
    if (!user || user.rewardPoints < amount) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    // Create redemption transaction
    await RewardTransaction.create({
      userId,
      type: 'redeemed',
      amount,
      description,
      category
    });

    // Update user points
    await User.findByIdAndUpdate(userId, {
      $inc: { rewardPoints: -amount }
    });

    res.json({ message: 'Reward redeemed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

module.exports = router;
