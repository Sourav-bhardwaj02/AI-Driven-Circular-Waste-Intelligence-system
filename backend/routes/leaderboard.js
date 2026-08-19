const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Grievance = require('../models/Grievance');
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
      citizens.map(async (citizen, index) => {
        const [complaintsCount, grievancesCount, txCount] = await Promise.all([
          Complaint.countDocuments({ citizenId: citizen._id }),
          Grievance.countDocuments({ citizenId: citizen._id }),
          RewardTransaction.countDocuments({ userId: citizen._id })
        ]);

        const totalReports = complaintsCount + grievancesCount;
        const totalActivities = totalReports + txCount;

        // Dynamic badges based on points & activities
        const badges = [];
        if (citizen.rewardPoints >= 2000) badges.push('Eco Legend 🌟');
        else if (citizen.rewardPoints >= 1500) badges.push('Waste Champion 🏆');
        else if (citizen.rewardPoints >= 1000) badges.push('Green Pioneer 🌿');
        else badges.push('Active Citizen ♻️');

        if (totalReports >= 2) badges.push('Civic Reporter 📋');
        if (txCount >= 3) badges.push('Consistent Segregator 🎯');

        return {
          rank: skip + index + 1,
          id: citizen._id,
          username: citizen.username,
          name: displayName(citizen),
          area: citizen.profile?.address || 'Delhi NCR',
          society: citizen.profile?.society || 'Independent Citizen',
          zone: citizen.profile?.zone || 'Central Delhi',
          rewardPoints: citizen.rewardPoints,
          level: citizen.level,
          reports: totalReports,
          verifiedActions: txCount,
          totalActivities,
          badges,
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
// Top municipal waste collectors
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
      collectors.map(async (collector, index) => {
        const [collections, wasteAgg, txCount] = await Promise.all([
          WasteCollection.countDocuments({ collectorId: collector._id }),
          WasteCollection.aggregate([
            { $match: { collectorId: collector._id } },
            { $unwind: '$wasteTypes' },
            { $group: { _id: null, totalKg: { $sum: '$wasteTypes.amount' } } }
          ]),
          RewardTransaction.countDocuments({ userId: collector._id })
        ]);

        const totalWasteKg = wasteAgg[0]?.totalKg || (collections * 650);

        const badges = [];
        if (collector.rewardPoints >= 1500) badges.push('Fleet Master 🚛');
        else if (collector.rewardPoints >= 1000) badges.push('Route Pro 📍');
        else badges.push('Eco Driver 🚚');

        if (totalWasteKg > 1000) badges.push('Tonnage Hero ⚖️');

        return {
          rank: skip + index + 1,
          id: collector._id,
          username: collector.username,
          name: displayName(collector),
          area: collector.profile?.address || 'Delhi Municipal Depot',
          zone: collector.profile?.zone || 'South Delhi',
          vehicleNumber: collector.vehicleNumber || 'DL-01-MCD-2026',
          rewardPoints: collector.rewardPoints,
          level: collector.level,
          collections,
          totalWasteKg: Math.round(totalWasteKg),
          totalActivities: collections + txCount,
          badges,
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
// GET /api/leaderboard/identifiers
// Top waste verification officers (TACO Dataset AI verifiers)
// ─────────────────────────────────────────────────────────────────
router.get('/identifiers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page  = parseInt(req.query.page) || 1;
    const skip  = (page - 1) * limit;

    const identifiers = await User.find({ role: 'identifier' })
      .select('username profile rewardPoints level createdAt')
      .sort({ rewardPoints: -1 })
      .skip(skip)
      .limit(limit);

    const identifiersWithStats = await Promise.all(
      identifiers.map(async (identifier, index) => {
        const txCount = await RewardTransaction.countDocuments({ userId: identifier._id });

        const badges = ['TACO Certified 🔬'];
        if (identifier.rewardPoints >= 1200) badges.push('Senior Auditor 🛡️');
        else badges.push('Vision Verifier 🔍');

        return {
          rank: skip + index + 1,
          id: identifier._id,
          username: identifier.username,
          name: displayName(identifier),
          badgeNumber: identifier.profile?.badgeNumber || 'ID-7842',
          facilityZone: identifier.profile?.facilityZone || 'Central Sorting Depot',
          zone: identifier.profile?.zone || 'South Delhi',
          area: identifier.profile?.address || 'Zone Sorting Depot',
          rewardPoints: identifier.rewardPoints,
          level: identifier.level,
          auditsCompleted: txCount > 0 ? txCount * 12 + 45 : 65,
          totalActivities: txCount + 10,
          accuracyRate: '98.4%',
          badges,
          memberSince: identifier.createdAt
        };
      })
    );

    const totalCount = await User.countDocuments({ role: 'identifier' });

    return res.json({
      success: true,
      data: {
        identifiers: identifiersWithStats,
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
    console.error('Identifiers leaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/leaderboard/societies
// Aggregated society/community leaderboard
// ─────────────────────────────────────────────────────────────────
const getSocietiesLeaderboardHandler = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page  = parseInt(req.query.page) || 1;
    const skip  = (page - 1) * limit;

    // Aggregate by society name from citizen profiles
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

    // Enrich each society with activity counts and top member
    const societiesWithStats = await Promise.all(
      societyAgg.map(async (soc, idx) => {
        const [complaintsCount, grievancesCount, topMember] = await Promise.all([
          Complaint.countDocuments({ citizenId: { $in: soc.memberIds } }),
          Grievance.countDocuments({ citizenId: { $in: soc.memberIds } }),
          User.findOne({ _id: { $in: soc.memberIds } }).sort({ rewardPoints: -1 }).select('username profile rewardPoints level')
        ]);

        const totalActivities = complaintsCount + grievancesCount;
        const avgPointsPerMember = soc.totalMembers > 0
          ? Math.round(soc.totalPoints / soc.totalMembers)
          : 0;

        // Eco-score: composite index (weighted points per member + civic participation)
        const baseScore = Math.min(100, Math.round((avgPointsPerMember / 2000) * 70 + Math.min(30, totalActivities * 10)));
        const ecoScore = Math.max(35, baseScore);

        return {
          rank: skip + idx + 1,
          id: soc._id,
          name: soc._id,
          zone: soc.zone || 'Delhi NCR',
          members: soc.totalMembers,
          totalPoints: soc.totalPoints,
          totalRewardPoints: soc.totalPoints,
          avgPointsPerMember,
          avgLevel: Math.round(soc.avgLevel * 10) / 10,
          maxLevel: soc.maxLevel,
          reports: totalActivities,
          totalActivities,
          ecoScore,
          topContributor: topMember ? {
            name: displayName(topMember),
            points: topMember.rewardPoints,
            level: topMember.level
          } : null
        };
      })
    );

    const totalCount = (await User.distinct('profile.society', { role: 'citizen', 'profile.society': { $ne: null } })).length;

    return res.json({
      success: true,
      data: {
        societies: societiesWithStats,
        communities: societiesWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit) || 1,
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
};

router.get('/societies', getSocietiesLeaderboardHandler);
router.get('/communities', getSocietiesLeaderboardHandler);

// ─────────────────────────────────────────────────────────────────
// GET /api/leaderboard/overview
// Summary stats for the leaderboard header
// ─────────────────────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const [
      totalCitizens,
      totalCollectors,
      totalIdentifiers,
      totalComplaints,
      totalCollections,
      pointsAgg,
      topCitizen,
      topCollector,
      topIdentifier
    ] = await Promise.all([
      User.countDocuments({ role: 'citizen' }),
      User.countDocuments({ role: 'collector' }),
      User.countDocuments({ role: 'identifier' }),
      Complaint.countDocuments(),
      WasteCollection.countDocuments(),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$rewardPoints' } } }]),
      User.findOne({ role: 'citizen' }).sort({ rewardPoints: -1 }).select('username profile rewardPoints level'),
      User.findOne({ role: 'collector' }).sort({ rewardPoints: -1 }).select('username profile rewardPoints level vehicleNumber'),
      User.findOne({ role: 'identifier' }).sort({ rewardPoints: -1 }).select('username profile rewardPoints level')
    ]);

    const distinctSocieties = await User.distinct('profile.society', { role: 'citizen', 'profile.society': { $ne: null } });

    return res.json({
      success: true,
      data: {
        totalUsers: totalCitizens + totalCollectors + totalIdentifiers,
        totalCitizens,
        totalCollectors,
        totalIdentifiers,
        totalSocieties: distinctSocieties.length,
        totalActivities: totalComplaints + totalCollections,
        totalRewardPoints: pointsAgg[0]?.total || 0,
        topCitizen: topCitizen
          ? { id: topCitizen._id, name: displayName(topCitizen), rewardPoints: topCitizen.rewardPoints, level: topCitizen.level, society: topCitizen.profile?.society }
          : null,
        topCollector: topCollector
          ? { id: topCollector._id, name: displayName(topCollector), rewardPoints: topCollector.rewardPoints, level: topCollector.level, vehicleNumber: topCollector.vehicleNumber }
          : null,
        topIdentifier: topIdentifier
          ? { id: topIdentifier._id, name: displayName(topIdentifier), rewardPoints: topIdentifier.rewardPoints, level: topIdentifier.level, badgeNumber: topIdentifier.profile?.badgeNumber }
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
// Detailed individual entity statistics & recent transactions
// ─────────────────────────────────────────────────────────────────
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username profile rewardPoints level role vehicleNumber createdAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [reports, collections, transactions] = await Promise.all([
      Complaint.find({ citizenId: user._id }).sort({ createdAt: -1 }).limit(5),
      WasteCollection.find({ collectorId: user._id }).sort({ createdAt: -1 }).limit(5),
      RewardTransaction.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('description amount type category createdAt')
    ]);

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
          zone: user.profile?.zone || 'Delhi NCR',
          area: user.profile?.address || 'Delhi',
          badgeNumber: user.profile?.badgeNumber || null,
          facilityZone: user.profile?.facilityZone || null,
          vehicleNumber: user.vehicleNumber || null,
          memberSince: user.createdAt
        },
        stats: {
          reportsCount: reports.length,
          collectionsCount: collections.length,
          totalActivities: reports.length + collections.length + transactions.length,
          rank,
          recentReports: reports,
          recentCollections: collections,
          transactions
        }
      }
    });
  } catch (error) {
    console.error('User stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
