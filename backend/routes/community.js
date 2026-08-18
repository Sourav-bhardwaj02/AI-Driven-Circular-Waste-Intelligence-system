const express = require('express');
const router = express.Router();
const User = require('../models/User');
const WasteCollection = require('../models/WasteCollection');
const Complaint = require('../models/Complaint');
const Grievance = require('../models/Grievance');
const RewardTransaction = require('../models/RewardTransaction');
const auth = require('../middleware/auth');

// @route   GET /api/community/posts
// @desc    Get community posts with pagination
router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sortBy = 'createdAt' } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortBy === 'popular' ? { upvotes: -1, comments: -1 } : -1;

    // Get posts (we'll use grievances and complaints as community posts for now)
    const grievances = await Grievance.find(filter)
      .populate('citizenId', 'name email avatar')
      .populate('assignedTo', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const complaints = await Complaint.find(filter)
      .populate('citizenId', 'name email avatar')
      .populate('assignedTo', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Combine and format as community posts
    const posts = [
      ...grievances.map(g => ({
        _id: g._id,
        type: 'grievance',
        title: g.title,
        content: g.description,
        category: g.category,
        author: g.citizenId,
        assignedTo: g.assignedTo,
        location: g.location,
        coordinates: g.coordinates,
        status: g.status,
        priority: g.priority,
        upvotes: Math.floor(Math.random() * 50) + 1,
        comments: Math.floor(Math.random() * 20) + 1,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt
      })),
      ...complaints.map(c => ({
        _id: c._id,
        type: 'complaint',
        title: `Issue in ${c.sector}`,
        content: c.description,
        category: 'Infrastructure',
        author: c.citizenId,
        assignedTo: c.assignedTo,
        location: c.sector,
        coordinates: c.location?.coordinates,
        status: c.status,
        priority: c.priority,
        upvotes: Math.floor(Math.random() * 30) + 1,
        comments: Math.floor(Math.random() * 15) + 1,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = await Grievance.countDocuments(filter) + await Complaint.countDocuments(filter);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/community/posts/:id
// @desc    Get single post by ID
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find in grievances first
    let post = await Grievance.findById(id)
      .populate('citizenId', 'name email avatar')
      .populate('assignedTo', 'name');

    if (post) {
      post = {
        ...post.toObject(),
        type: 'grievance',
        upvotes: Math.floor(Math.random() * 50) + 1,
        comments: []
      };
    } else {
      // Try in complaints
      post = await Complaint.findById(id)
        .populate('citizenId', 'name email avatar')
        .populate('assignedTo', 'name');

      if (post) {
        post = {
          ...post.toObject(),
          type: 'complaint',
          upvotes: Math.floor(Math.random() * 30) + 1,
          comments: []
        };
      }
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/community/posts
// @desc    Create a new community post (grievance/complaint)
router.post('/posts', auth, async (req, res) => {
  try {
    const { type, title, description, category, location, coordinates, priority } = req.body;
    const userId = req.user.id;

    if (!type || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    let post;
    if (type === 'grievance') {
      post = await Grievance.create({
        citizenId: userId,
        title,
        category: category || 'Other',
        description,
        location: location || 'Unknown Location',
        coordinates: coordinates || { type: 'Point', coordinates: [77.2090, 28.6139] },
        status: 'Pending',
        priority: priority || 'medium'
      });
    } else if (type === 'complaint') {
      post = await Complaint.create({
        citizenId: userId,
        sector: location || 'Unknown Sector',
        description,
        priority: priority || 'medium',
        location: coordinates || { type: 'Point', coordinates: [77.2090, 28.6139] },
        status: 'pending'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid post type'
      });
    }

    // Populate author info
    await post.populate('citizenId', 'name email avatar');

    res.status(201).json({
      success: true,
      data: {
        ...post.toObject(),
        type,
        upvotes: 0,
        comments: []
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/community/posts/:id/upvote
// @desc    Upvote a post
router.put('/posts/:id/upvote', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // In a real app, you'd track upvotes in a separate collection
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Post upvoted successfully',
      data: {
        upvotes: Math.floor(Math.random() * 50) + 1
      }
    });
  } catch (error) {
    console.error('Error upvoting post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/community/posts/:id/comments
// @desc    Add comment to a post
router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // In a real app, you'd store comments in a separate collection
    // For now, we'll just return a mock comment
    const user = await User.findById(userId, 'name email avatar');
    const comment = {
      _id: new Date().getTime().toString(),
      content,
      author: {
        _id: userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/community/leaderboard
// @desc    Get community leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'monthly', limit = 10 } = req.query;

    // Get top contributors based on waste collections
    const topCollectors = await User.aggregate([
      { $match: { role: 'collector' } },
      {
        $lookup: {
          from: 'wastecollections',
          localField: '_id',
          foreignField: 'collectorId',
          as: 'collections'
        }
      },
      {
        $addFields: {
          totalCollections: { $size: '$collections' },
          completedCollections: {
            $size: {
              $filter: {
                input: '$collections',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          }
        }
      },
      { $sort: { completedCollections: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          totalCollections: 1,
          completedCollections: 1,
          completionRate: {
            $cond: [
              { $eq: ['$totalCollections', 0] },
              0,
              { $multiply: [{ $divide: ['$completedCollections', '$totalCollections'] }, 100] }
            ]
          }
        }
      }
    ]);

    // Get top citizens based on reports
    const topCitizens = await User.aggregate([
      { $match: { role: 'citizen' } },
      {
        $lookup: {
          from: 'grievances',
          localField: '_id',
          foreignField: 'citizenId',
          as: 'grievances'
        }
      },
      {
        $lookup: {
          from: 'complaints',
          localField: '_id',
          foreignField: 'citizenId',
          as: 'complaints'
        }
      },
      {
        $addFields: {
          totalReports: { $add: [{ $size: '$grievances' }, { $size: '$complaints' }] }
        }
      },
      { $sort: { totalReports: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          totalReports: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        topCollectors,
        topCitizens,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/community/stats
// @desc    Get community statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalCollectors,
      totalWasteCollections,
      totalGrievances,
      totalComplaints,
      resolvedGrievances,
      resolvedComplaints
    ] = await Promise.all([
      User.countDocuments({ role: 'citizen' }),
      User.countDocuments({ role: 'collector' }),
      WasteCollection.countDocuments(),
      Grievance.countDocuments(),
      Complaint.countDocuments(),
      Grievance.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'resolved' })
    ]);

    // Get waste collections by status
    const collectionsByStatus = await WasteCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get grievances by category
    const grievancesByCategory = await Grievance.aggregate([
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
        overview: {
          totalUsers,
          totalCollectors,
          totalWasteCollections,
          totalGrievances,
          totalComplaints,
          resolvedGrievances,
          resolvedComplaints,
          grievanceResolutionRate: totalGrievances > 0 ? ((resolvedGrievances / totalGrievances) * 100).toFixed(1) : 0,
          complaintResolutionRate: totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0
        },
        collectionsByStatus: collectionsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        grievancesByCategory: grievancesByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/community/events
// @desc    Get community events
router.get('/events', async (req, res) => {
  try {
    // Mock community events data
    const events = [
      {
        _id: '1',
        title: 'Community Clean-up Drive',
        description: 'Join us for a community clean-up drive in Sector 11',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Sector 11 Community Center',
        type: 'cleanup',
        organizer: 'WasteWise Team',
        participants: 45,
        maxParticipants: 100,
        image: '/api/placeholder/events/cleanup.jpg'
      },
      {
        _id: '2',
        title: 'Waste Segregation Workshop',
        description: 'Learn about proper waste segregation techniques',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        location: 'Green Park Community Hall',
        type: 'workshop',
        organizer: 'WasteWise Team',
        participants: 28,
        maxParticipants: 50,
        image: '/api/placeholder/events/workshop.jpg'
      },
      {
        _id: '3',
        title: 'Recycling Awareness Campaign',
        description: 'Awareness campaign about recycling benefits',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        location: 'Sector 12 Market',
        type: 'campaign',
        organizer: 'WasteWise Team',
        participants: 67,
        maxParticipants: 200,
        image: '/api/placeholder/events/campaign.jpg'
      }
    ];

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
