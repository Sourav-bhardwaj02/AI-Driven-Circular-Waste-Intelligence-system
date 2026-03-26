const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const WasteCollection = require('../models/WasteCollection');
const RewardTransaction = require('../models/RewardTransaction');

// @route   GET /api/leaderboard/citizens
// @desc    Get top citizens by reward points
router.get('/citizens', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Get citizens with their statistics
    const citizens = await User.find({ role: 'citizen' })
      .select('username profile rewardPoints level location')
      .sort({ rewardPoints: -1 })
      .skip(skip)
      .limit(limit);

    // Count total complaints and waste collections for each citizen
    const citizensWithStats = await Promise.all(
      citizens.map(async (citizen) => {
        const [complaintCount, collectionCount, recentTransactions] = await Promise.all([
          Complaint.countDocuments({ citizenId: citizen._id }),
          WasteCollection.countDocuments({ citizenId: citizen._id }),
          RewardTransaction.find({ userId: citizen._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('points category createdAt')
        ]);

        return {
          id: citizen._id,
          username: citizen.username,
          name: citizen.profile.firstName && citizen.profile.lastName 
            ? `${citizen.profile.firstName} ${citizen.profile.lastName}`
            : citizen.username,
          area: citizen.profile.address || 'Unknown Area',
          rewardPoints: citizen.rewardPoints,
          level: citizen.level,
          reports: complaintCount,
          collections: collectionCount,
          totalActivities: complaintCount + collectionCount,
          recentTransactions,
          location: citizen.location
        };
      })
    );

    // Get total count for pagination
    const totalCount = await User.countDocuments({ role: 'citizen' });

    res.json({
      success: true,
      data: {
        citizens: citizensWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching citizens leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/leaderboard/collectors
// @desc    Get top collectors by performance
router.get('/collectors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Get collectors with their statistics
    const collectors = await User.find({ role: 'collector' })
      .select('username profile rewardPoints level location')
      .sort({ rewardPoints: -1 })
      .skip(skip)
      .limit(limit);

    // Count total collections and routes for each collector
    const collectorsWithStats = await Promise.all(
      collectors.map(async (collector) => {
        const [collectionCount, completedRoutes, recentTransactions] = await Promise.all([
          WasteCollection.countDocuments({ collectorId: collector._id }),
          Route.countDocuments({ 
            assignedCollector: collector._id,
            status: 'completed'
          }),
          RewardTransaction.find({ userId: collector._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('points category createdAt')
        ]);

        return {
          id: collector._id,
          username: collector.username,
          name: collector.profile.firstName && collector.profile.lastName 
            ? `${collector.profile.firstName} ${collector.profile.lastName}`
            : collector.username,
          area: collector.profile.address || 'Unknown Area',
          rewardPoints: collector.rewardPoints,
          level: collector.level,
          collections: collectionCount,
          completedRoutes,
          totalActivities: collectionCount + completedRoutes,
          recentTransactions,
          location: collector.location
        };
      })
    );

    // Get total count for pagination
    const totalCount = await User.countDocuments({ role: 'collector' });

    res.json({
      success: true,
      data: {
        collectors: collectorsWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching collectors leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/leaderboard/communities
// @desc    Get top communities by aggregated performance
router.get('/communities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Aggregate citizens by area/community
    const communityAggregation = await User.aggregate([
      { $match: { role: 'citizen', 'profile.address': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$profile.address',
          totalMembers: { $sum: 1 },
          totalRewardPoints: { $sum: '$rewardPoints' },
          avgLevel: { $avg: '$level' },
          memberIds: { $push: '$_id' }
        }
      },
      { $sort: { totalRewardPoints: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get additional statistics for each community
    const communitiesWithStats = await Promise.all(
      communityAggregation.map(async (community) => {
        const [complaintCount, collectionCount] = await Promise.all([
          Complaint.countDocuments({ 
            citizenId: { $in: community.memberIds },
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          }),
          WasteCollection.countDocuments({ 
            citizenId: { $in: community.memberIds },
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          })
        ]);

        return {
          name: community._id,
          members: community.totalMembers,
          totalRewardPoints: community.totalRewardPoints,
          avgLevel: Math.round(community.avgLevel * 10) / 10,
          recentReports: complaintCount,
          recentCollections: collectionCount,
          totalActivities: complaintCount + collectionCount,
          avgPointsPerMember: Math.round(community.totalRewardPoints / community.totalMembers)
        };
      })
    );

    // Get total count for pagination
    const totalCommunities = await User.distinct('profile.address', {
      role: 'citizen',
      'profile.address': { $exists: true, $ne: '' }
    });

    res.json({
      success: true,
      data: {
        communities: communitiesWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCommunities.length / limit),
          totalCount: totalCommunities.length,
          hasNext: page * limit < totalCommunities.length,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching communities leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/leaderboard/user/:userId/stats
// @desc    Get detailed statistics for a specific user
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user details
    const user = await User.findById(userId).select('username profile rewardPoints level role');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's statistics based on role
    let stats = {};
    
    if (user.role === 'citizen') {
      const [complaintCount, collectionCount, recentTransactions, monthlyStats] = await Promise.all([
        Complaint.countDocuments({ citizenId: userId }),
        WasteCollection.countDocuments({ citizenId: userId }),
        RewardTransaction.find({ userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('points category createdAt'),
        RewardTransaction.aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              totalPoints: { $sum: '$points' },
              transactions: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 6 }
        ])
      ]);

      stats = {
        complaints: complaintCount,
        collections: collectionCount,
        recentTransactions,
        monthlyStats: monthlyStats.map(stat => ({
          month: new Date(stat._id.year, stat._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          points: stat.totalPoints,
          transactions: stat.transactions
        }))
      };
    } else if (user.role === 'collector') {
      const [collectionCount, completedRoutes, recentTransactions, monthlyStats] = await Promise.all([
        WasteCollection.countDocuments({ collectorId: userId }),
        Route.countDocuments({ 
          assignedCollector: userId,
          status: 'completed'
        }),
        RewardTransaction.find({ userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('points category createdAt'),
        RewardTransaction.aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              totalPoints: { $sum: '$points' },
              transactions: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 6 }
        ])
      ]);

      stats = {
        collections: collectionCount,
        completedRoutes,
        recentTransactions,
        monthlyStats: monthlyStats.map(stat => ({
          month: new Date(stat._id.year, stat._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          points: stat.totalPoints,
          transactions: stat.transactions
        }))
      };
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: user.profile.firstName && user.profile.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.username,
          role: user.role,
          rewardPoints: user.rewardPoints,
          level: user.level
        },
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/leaderboard/overview
// @desc    Get leaderboard overview statistics
router.get('/overview', async (req, res) => {
  try {
    const [
      totalCitizens,
      totalCollectors,
      totalComplaints,
      totalCollections,
      totalRewardPoints,
      topCitizen,
      topCollector
    ] = await Promise.all([
      User.countDocuments({ role: 'citizen' }),
      User.countDocuments({ role: 'collector' }),
      Complaint.countDocuments(),
      WasteCollection.countDocuments(),
      User.aggregate([
        { $group: { _id: null, totalPoints: { $sum: '$rewardPoints' } } }
      ]),
      User.findOne({ role: 'citizen' }).sort({ rewardPoints: -1 }).select('username profile rewardPoints'),
      User.findOne({ role: 'collector' }).sort({ rewardPoints: -1 }).select('username profile rewardPoints')
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: totalCitizens + totalCollectors,
        totalCitizens,
        totalCollectors,
        totalActivities: totalComplaints + totalCollections,
        totalRewardPoints: totalRewardPoints[0]?.totalPoints || 0,
        topCitizen: topCitizen ? {
          name: topCitizen.profile.firstName && topCitizen.profile.lastName 
            ? `${topCitizen.profile.firstName} ${topCitizen.profile.lastName}`
            : topCitizen.username,
          rewardPoints: topCitizen.rewardPoints
        } : null,
        topCollector: topCollector ? {
          name: topCollector.profile.firstName && topCollector.profile.lastName 
            ? `${topCollector.profile.firstName} ${topCollector.profile.lastName}`
            : topCollector.username,
          rewardPoints: topCollector.rewardPoints
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
