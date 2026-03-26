const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Grievance = require('../models/Grievance');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/grievances');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/grievance
// @desc    Get all grievances with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Add filters
    if (status) query.status = status;
    if (category) query.category = category;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const grievances = await Grievance.find(query)
      .populate('citizenId', 'username profile.firstName profile.lastName')
      .populate('votedBy', 'username')
      .populate('comments.user', 'username profile.firstName profile.lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Grievance.countDocuments(query);

    res.json({
      success: true,
      data: {
        grievances,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/grievance/:id
// @desc    Get single grievance by ID
router.get('/:id', async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('citizenId', 'username profile.firstName profile.lastName')
      .populate('votedBy', 'username')
      .populate('comments.user', 'username profile.firstName profile.lastName')
      .populate('assignedTo', 'username profile.firstName profile.lastName');

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    res.json({
      success: true,
      data: grievance
    });
  } catch (error) {
    console.error('Error fetching grievance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/grievance
// @desc    Create new grievance
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, location, coordinates } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Parse coordinates if provided
    let parsedCoordinates = null;
    if (coordinates) {
      try {
        parsedCoordinates = JSON.parse(coordinates);
      } catch (e) {
        parsedCoordinates = null;
      }
    }

    // Create grievance
    const grievance = await Grievance.create({
      citizenId: userId,
      title,
      description,
      category,
      location,
      coordinates: parsedCoordinates || {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Default Delhi coordinates
      },
      image: req.file ? `/uploads/grievances/${req.file.filename}` : null,
      status: 'Pending',
      priority: 0,
      votedBy: []
    });

    // Populate user info
    await grievance.populate('citizenId', 'username profile.firstName profile.lastName');

    res.status(201).json({
      success: true,
      data: grievance
    });
  } catch (error) {
    console.error('Error creating grievance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/grievance/:id/vote
// @desc    Upvote a grievance to increase priority
router.put('/:id/vote', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    // Check if user has already voted
    if (grievance.votedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this grievance'
      });
    }

    // Add vote and increase priority
    grievance.votedBy.push(userId);
    grievance.priority += 1;
    await grievance.save();

    res.json({
      success: true,
      data: grievance
    });
  } catch (error) {
    console.error('Error voting on grievance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/grievance/:id/comment
// @desc    Add comment to grievance
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    // Add comment
    grievance.comments.push({
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    });

    await grievance.save();

    // Populate the new comment
    await grievance.populate('comments.user', 'username profile.firstName profile.lastName');

    res.json({
      success: true,
      data: grievance
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/grievance/:id/status
// @desc    Update grievance status (admin/collector only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const userId = req.user.id;

    // Check user permissions
    const user = await User.findById(userId);
    if (!['admin', 'collector'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update grievance status'
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    // Update status
    grievance.status = status;
    
    if (assignedTo) {
      grievance.assignedTo = assignedTo;
    }

    if (status === 'Resolved') {
      grievance.resolvedAt = new Date();
    }

    await grievance.save();

    // Populate all fields
    await grievance.populate('citizenId', 'username profile.firstName profile.lastName');
    await grievance.populate('assignedTo', 'username profile.firstName profile.lastName');

    res.json({
      success: true,
      data: grievance
    });
  } catch (error) {
    console.error('Error updating grievance status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/grievance/stats
// @desc    Get grievance statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalGrievances,
      pendingGrievances,
      inProgressGrievances,
      resolvedGrievances
    ] = await Promise.all([
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: 'Pending' }),
      Grievance.countDocuments({ status: 'In Progress' }),
      Grievance.countDocuments({ status: 'Resolved' })
    ]);

    const categoryStats = await Grievance.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalGrievances,
        pending: pendingGrievances,
        inProgress: inProgressGrievances,
        resolved: resolvedGrievances,
        categoryBreakdown: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching grievance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
