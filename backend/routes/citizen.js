const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const WasteCollection = require('../models/WasteCollection');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const Route = require('../models/Route');

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

    const user = await User.findById(req.params.userId).select('rewardPoints level username');

    res.json({
      success: true,
      rewardPoints: user ? user.rewardPoints : 0,
      level: user ? user.level : 1,
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Redeem rewards
router.post('/redeem', async (req, res) => {
  try {
    const { userId, category, amount, description } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid redemption parameters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.rewardPoints < amount) {
      return res.status(400).json({ success: false, message: `Insufficient points balance. You need ${amount} points.` });
    }

    // Generate random voucher code (e.g., WW-WATER-8X92K)
    const categoryCode = (category || 'ECO').toUpperCase().substring(0, 5);
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const voucherCode = `WW-${categoryCode}-${randomHex}`;

    // Create redemption transaction
    const transaction = await RewardTransaction.create({
      userId,
      type: 'redeemed',
      amount,
      description: `${description || 'Reward Voucher'} (Code: ${voucherCode})`,
      category: category || 'bill_payment'
    });

    // Update user points
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { rewardPoints: -amount } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Reward redeemed successfully!',
      voucherCode,
      newBalance: updatedUser.rewardPoints,
      transaction
    });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Claim Daily Eco Bonus (+25 points)
router.post('/daily-claim', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user already claimed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const existingClaim = await RewardTransaction.findOne({
      userId,
      category: 'daily_pickup',
      createdAt: { $gte: startOfToday }
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: 'Daily eco bonus already claimed today! Check back tomorrow.'
      });
    }

    // Create reward transaction
    const bonusAmount = 25;
    const transaction = await RewardTransaction.create({
      userId,
      type: 'earned',
      amount: bonusAmount,
      description: 'Daily Eco Check-in Bonus',
      category: 'daily_pickup'
    });

    // Update user points and check level up
    const newPoints = user.rewardPoints + bonusAmount;
    const newLevel = Math.max(user.level, Math.floor(newPoints / 500) + 1);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { rewardPoints: bonusAmount },
        level: newLevel
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `🎉 Success! You earned +${bonusAmount} Eco Points for your daily check-in.`,
      newBalance: updatedUser.rewardPoints,
      level: updatedUser.level,
      transaction
    });
  } catch (error) {
    console.error('Daily claim error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
