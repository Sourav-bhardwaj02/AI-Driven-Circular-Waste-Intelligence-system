const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const WasteCollection = require('../models/WasteCollection');
const RewardTransaction = require('../models/RewardTransaction');

// ─────────────────────────────────────────────────────────────────
// Helper: display name from user doc
// ─────────────────────────────────────────────────────────────────
const displayName = (u) =>
  u.profile?.firstName && u.profile?.lastName
    ? `${u.profile.firstName} ${u.profile.lastName}`
    : u.username;

// ─────────────────────────────────────────────────────────────────
// GET /api/leaderboard/citizens
// Top citizens ranked by rewardPoints
// ─────────────────────────────────────────────────────────────────
router.get('/citizens', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page  = parseInt(req.query.page) || 1;
    const skip  = (page - 1) * limit;

    const citizens = await User.find({ role: 'citizen' })
      .select('username profile rewardPoints level createdAt')
      .sort({ rewardPoints: -1 })
      .skip(skip)
      .limit(limit);

    const citizensWithStats = await Promise.all(
      citizens.map(async (citizen) => {
        const [reports, collections] = await Promise.all([
          Complaint.countDocuments({ citizenId: citizen._id }),
          WasteCollection.countDocuments({ citizenId: citizen._id })
        ]);

        return {
          id: citizen._id,
          username: citizen.username,
          name: displayName(citizen),
          area: citizen.profile?.address || 'Delhi',
          society: citizen.profile?.society || null,
          zone: citizen.profile?.zone || null,
          rewardPoints: citizen.rewardPoints,
          level: citizen.level,
          reports,
          collections,
          totalActivities: reports + collections,
          memberSince: citizen.createdAt
        };
      })
    );

    const totalCount = await User.countDocuments({ role: 'citizen' });

    return res.json({
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
    console.error('Citizens leaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/leaderboard/collectors
// Top collectors ranked by rewardPoints + collection count
// ─────────────────────────────────────────────────────────────────
router.get('/collectors', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page  = parseInt(req.query.page) || 1;
    const skip  = (page - 1) * limit;

    const collectors = await User.find({ role: 'collector' })
      .select('username profile rewardPoints level vehicleNumber createdAt')
      .sort({ rewardPoints: -1 })
      .skip(skip)
      .limit(limit);

    const collectorsWithStats = await Promise.all(
      collectors.map(async (collector) => {
        const collections = await WasteCollection.countDocuments({ collectorId: collector._id });

        return {
          id: collector._id,
          username: collector.username,
          name: displayName(collector),
          area: collector.profile?.address || 'Delhi',
          zone: collector.profile?.zone || null,
          vehicleNumber: collector.vehicleNumber || null,
          rewardPoints: collector.rewardPoints,
          level: collector.level,
          collections,
          totalActivities: collections,
          memberSince: collector.createdAt
        };
      })
    );

    const totalCount = await User.countDocuments({ role: 'collector' });

    return res.json({
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
    console.error('Collectors leaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/leaderboard/societies
// Aggregated society/community leaderboard
// ─────────────────────────────────────────────────────────────────
router.get('/societies', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page  = parseInt(req.query.page) || 1;
    const skip  = (page - 1) * limit;

    // Aggregate by society name (fall back to address → zone → 'Independent')
    const societyAgg = await User.aggregate([
      { $match: { role: 'citizen' } },
      {
        $addFields: {
          societyKey: {
            $cond: [
              { $and: [{ $ne: ['$profile.society', null] }, { $ne: ['$profile.society', ''] }] },
              '$profile.society',
              {
                $cond: [
                  { $and: [{ $ne: ['$profile.address', null] }, { $ne: ['$profile.address', ''] }] },
                  '$profile.address',
                  { $ifNull: ['$profile.zone', 'Delhi NCR'] }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$societyKey',
          totalMembers:      { $sum: 1 },
          totalPoints:       { $sum: '$rewardPoints' },
          avgLevel:          { $avg: '$level' },
          maxLevel:          { $max: '$level' },
          memberIds:         { $push: '$_id' },
          zone:              { $first: '$profile.zone' }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Enrich each society with activity counts
    const societiesWithStats = await Promise.all(
      societyAgg.map(async (soc, idx) => {
        const [reports, collections] = await Promise.all([
          Complaint.countDocuments({ citizenId: { $in: soc.memberIds } }),
          WasteCollection.countDocuments({ citizenId: { $in: soc.memberIds } })
        ]);

        const totalActivities = reports + collections;
        const avgPointsPerMember = soc.totalMembers > 0
          ? Math.round(soc.totalPoints / soc.totalMembers)
          : 0;

        // Eco-score: weighted composite (60% points efficiency, 40% activity rate)
        const ecoScore = Math.min(
          100,
          Math.round(
            (avgPointsPerMember / 1000) * 60 +
            (totalActivities / Math.max(soc.totalMembers, 1)) * 40
          )
        );

        return {
          rank: skip + idx + 1,
          name: soc._id,
          zone: soc.zone || 'Delhi NCR',
          members: soc.totalMembers,
          totalPoints: soc.totalPoints,
          avgPointsPerMember,
          avgLevel: Math.round(soc.avgLevel * 10) / 10,
          maxLevel: soc.maxLevel,
          reports,
          collections,
          totalActivities,
          ecoScore
        };
      })
    );

    // Count total distinct societies
    const distinctSocieties = await User.aggregate([
      { $match: { role: 'citizen' } },
      {
        $addFields: {
          societyKey: {
            $cond: [
              { $and: [{ $ne: ['$profile.society', null] }, { $ne: ['$profile.society', ''] }] },
              '$profile.society',
              { $ifNull: ['$profile.address', 'Delhi NCR'] }
            ]
          }
        }
      },
      { $group: { _id: '$societyKey' } },
      { $count: 'total' }
    ]);
    const totalCount = distinctSocieties[0]?.total || 0;

    return res.json({
      success: true,
      data: {
        societies: societiesWithStats,
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
    console.error('Societies leaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/leaderboard/communities (alias → societies, backwards compat)
// ─────────────────────────────────────────────────────────────────
router.get('/communities', async (req, res) => {
  req.url = '/societies';
  router.handle(req, res, () => {});
});

// ─────────────────────────────────────────────────────────────────
// GET /api/leaderboard/overview
// Summary stats for the leaderboard header
// ─────────────────────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const [
      totalCitizens,
      totalCollectors,
      totalComplaints,
      totalCollections,
      pointsAgg,
      topCitizen,
      topCollector
    ] = await Promise.all([
      User.countDocuments({ role: 'citizen' }),
      User.countDocuments({ role: 'collector' }),
      Complaint.countDocuments(),
      WasteCollection.countDocuments(),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$rewardPoints' } } }]),
      User.findOne({ role: 'citizen' }).sort({ rewardPoints: -1 }).select('username profile rewardPoints level'),
      User.findOne({ role: 'collector' }).sort({ rewardPoints: -1 }).select('username profile rewardPoints level')
    ]);

    // Total distinct societies
    const societyCount = await User.aggregate([
      { $match: { role: 'citizen', 'profile.society': { $exists: true, $ne: '' } } },
      { $group: { _id: '$profile.society' } },
      { $count: 'total' }
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers: totalCitizens + totalCollectors,
        totalCitizens,
        totalCollectors,
        totalActivities: totalComplaints + totalCollections,
        totalRewardPoints: pointsAgg[0]?.total || 0,
        totalSocieties: societyCount[0]?.total || 0,
        topCitizen: topCitizen
          ? { name: displayName(topCitizen), rewardPoints: topCitizen.rewardPoints, level: topCitizen.level }
          : null,
        topCollector: topCollector
          ? { name: displayName(topCollector), rewardPoints: topCollector.rewardPoints, level: topCollector.level }
          : null
      }
    });
  } catch (error) {
    console.error('Leaderboard overview error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/leaderboard/user/:userId/stats
// ─────────────────────────────────────────────────────────────────
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username profile rewardPoints level role');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [reports, collections, transactions] = await Promise.all([
      Complaint.countDocuments({ citizenId: user._id }),
      WasteCollection.countDocuments({ citizenId: user._id }),
      RewardTransaction.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('points category createdAt')
    ]);

    // Rank of this user among their role
    const rank = await User.countDocuments({
      role: user.role,
      rewardPoints: { $gt: user.rewardPoints }
    }) + 1;

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: displayName(user),
          role: user.role,
          rewardPoints: user.rewardPoints,
          level: user.level,
          society: user.profile?.society || null,
          zone: user.profile?.zone || null,
          area: user.profile?.address || 'Delhi'
        },
        stats: { reports, collections, totalActivities: reports + collections, rank, transactions }
      }
    });
  } catch (error) {
    console.error('User stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
