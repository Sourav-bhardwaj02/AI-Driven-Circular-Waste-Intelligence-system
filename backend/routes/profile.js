const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Grievance = require('../models/Grievance');
const WasteCollection = require('../models/WasteCollection');
const RewardTransaction = require('../models/RewardTransaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/profile
// @desc    Get current user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('assignedRoute', 'routeCode name areas status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
router.put('/', auth, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, address, location } = req.body;

    const updateData = {
      profile: {
        firstName,
        lastName,
        phone,
        address
      }
    };

    // Parse location if provided
    if (location) {
      try {
        const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          updateData.location = {
            type: 'Point',
            coordinates: [lng, lat]
          };
        }
      } catch (e) {
        // Location parsing failed, skip
      }
    }

    // Add avatar if uploaded
    if (req.file) {
      // Remove old avatar if exists
      const currentUser = await User.findById(userId);
      if (currentUser.profile.avatar && currentUser.profile.avatar.startsWith('/uploads/')) {
        const oldAvatarPath = path.join(__dirname, '..', currentUser.profile.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      
      updateData.profile.avatar = `/uploads/profiles/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/profile/activity
// @desc    Get user activity log
router.get('/activity', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    let activities = [];

    if (user.role === 'citizen') {
      // Get grievances filed by citizen
      const grievances = await Grievance.find({ citizenId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      activities = grievances.map(g => ({
        type: 'grievance',
        action: `Filed grievance: ${g.title}`,
        description: g.description.substring(0, 100) + '...',
        status: g.status,
        createdAt: g.createdAt,
        id: g._id
      }));

      // Get waste collections by citizen
      const collections = await WasteCollection.find({ citizenId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const collectionActivities = collections.map(c => ({
        type: 'collection',
        action: 'Waste collected',
        description: `${c.area} - ${c.wasteTypes.map(w => w.type).join(', ')}`,
        status: c.status,
        createdAt: c.createdAt,
        id: c._id
      }));

      activities = [...activities, ...collectionActivities];
    } else if (user.role === 'collector') {
      // Get collections handled by collector
      const collections = await WasteCollection.find({ collectorId: userId })
        .populate('citizenId', 'username profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      activities = collections.map(c => ({
        type: 'collection',
        action: 'Collected waste',
        description: `${c.area} from ${c.citizenId?.profile?.firstName || 'Citizen'}`,
        status: c.status,
        createdAt: c.createdAt,
        id: c._id
      }));
    }

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Paginate
    const paginatedActivities = activities.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(activities.length / limit),
          totalCount: activities.length,
          hasNext: page * limit < activities.length,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/profile/stats
// @desc    Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let stats = {
      rewardPoints: user.rewardPoints,
      level: user.level,
      totalActivities: 0
    };

    if (user.role === 'citizen') {
      const [grievanceCount, collectionCount] = await Promise.all([
        Grievance.countDocuments({ citizenId: userId }),
        WasteCollection.countDocuments({ citizenId: userId })
      ]);

      stats = {
        ...stats,
        grievances: grievanceCount,
        collections: collectionCount,
        resolvedGrievances: await Grievance.countDocuments({ citizenId: userId, status: 'Resolved' }),
        totalActivities: grievanceCount + collectionCount
      };
    } else if (user.role === 'collector') {
      const [collectionCount, completedRoutes] = await Promise.all([
        WasteCollection.countDocuments({ collectorId: userId }),
        Route.countDocuments({ assignedCollector: userId, status: 'completed' })
      ]);

      stats = {
        ...stats,
        collections: collectionCount,
        completedRoutes,
        totalActivities: collectionCount + completedRoutes
      };
    } else if (user.role === 'admin') {
      const [totalUsers, totalGrievances, totalCollectors] = await Promise.all([
        User.countDocuments({ role: 'citizen' }),
        Grievance.countDocuments(),
        User.countDocuments({ role: 'collector' })
      ]);

      stats = {
        ...stats,
        managedCitizens: totalUsers,
        managedCollectors: totalCollectors,
        totalGrievances,
        pendingGrievances: await Grievance.countDocuments({ status: 'Pending' })
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/profile/leaderboard
// @desc    Get leaderboard for user's role
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let leaderboard = [];

    if (user.role === 'citizen') {
      leaderboard = await User.find({ role: 'citizen' })
        .select('username profile.firstName profile.lastName rewardPoints level')
        .sort({ rewardPoints: -1 })
        .limit(50);
    } else if (user.role === 'collector') {
      leaderboard = await User.find({ role: 'collector' })
        .select('username profile.firstName profile.lastName rewardPoints level')
        .sort({ rewardPoints: -1 })
        .limit(50);
    }

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((u, index) => ({
      ...u.toObject(),
      rank: index + 1,
      isCurrentUser: u._id.toString() === userId
    }));

    res.json({
      success: true,
      data: rankedLeaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
