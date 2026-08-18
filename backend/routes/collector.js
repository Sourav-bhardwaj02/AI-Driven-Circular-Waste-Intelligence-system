const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const WasteCollection = require('../models/WasteCollection');
const User = require('../models/User');
const Route = require('../models/Route');
const RewardTransaction = require('../models/RewardTransaction');

// Get collector dashboard data
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const collector = await User.findById(req.params.userId);
    
    if (!collector || collector.role !== 'collector') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get assigned routes
    const assignedRoutes = await Route.find({ 
      collectorId: collector._id,
      status: { $in: ['assigned', 'in_progress'] }
    }).sort({ scheduledStart: 1 });

    const currentRoute = assignedRoutes.find(route => route.status === 'in_progress') || assignedRoutes[0];

    // Get today's collections
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCollections = await WasteCollection.find({
      collectorId: collector._id,
      createdAt: { $gte: today }
    }).sort({ createdAt: -1 });

    const pickups = todayCollections.map(collection => ({
      id: collection._id,
      name: `${collection.area} - ${collection.route}`,
      time: getTimeAgo(collection.createdAt),
      status: collection.status === 'completed' ? 'Completed' : 
              collection.status === 'in_progress' ? 'Completing' : 
              collection.status === 'pending' ? 'Processed' : 'Collected'
    }));

    // Get collection statistics by area
    const areaStats = await WasteCollection.aggregate([
      { $match: { collectorId: collector._id } },
      { $group: { _id: '$area', total: { $sum: { $sum: '$wasteTypes.amount' } } } },
      { $sort: { total: -1 } },
      { $limit: 4 }
    ]);

    const areas = areaStats.map(stat => ({
      name: stat._id,
      value: stat.total.toLocaleString(),
      label: 'Collection Points'
    }));

    res.json({
      collectorStatus: collector.status || 'active',
      currentRoute: currentRoute ? {
        id: currentRoute._id,
        routeCode: currentRoute.routeCode,
        name: currentRoute.name,
        areas: currentRoute.areas.map(area => area.name).join(' · '),
        scheduledStart: currentRoute.scheduledStart,
        scheduledEnd: currentRoute.scheduledEnd,
        status: currentRoute.status,
        aiOptimized: currentRoute.aiOptimized
      } : null,
      pickups,
      areas,
      rewardPoints: collector.rewardPoints || 0,
      routeStarted: currentRoute?.status === 'in_progress' || false
    });
  } catch (error) {
    console.error('Collector dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update collector duty status (active, busy, idle, offline)
router.put('/status/:userId', async (req, res) => {
  try {
    const { status } = req.body;
    const { userId } = req.params;

    if (!['active', 'busy', 'idle', 'offline', 'in_progress'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const collector = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );

    if (!collector) {
      return res.status(404).json({ message: 'Collector not found' });
    }

    // Emit real-time socket update
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      if (io) {
        io.emit('collector-status-update', {
          id: collector._id,
          username: collector.username,
          status: collector.status,
          updatedAt: new Date()
        });
      }
    } catch (sErr) {
      console.warn("Socket notification warning:", sErr.message);
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      status: collector.status
    });
  } catch (error) {
    console.error('Error updating collector status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start/Stop route (handles both MongoDB ObjectId and routeCode)
router.put('/route/:routeId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const routeIdParam = req.params.routeId;

    let route;
    if (mongoose.Types.ObjectId.isValid(routeIdParam)) {
      route = await Route.findById(routeIdParam);
    }
    if (!route) {
      route = await Route.findOne({ routeCode: routeIdParam });
    }

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const updateData = { status };
    if (status === 'in_progress') {
      updateData.actualStart = new Date();
    } else if (status === 'completed') {
      updateData.actualEnd = new Date();
    }

    const updatedRoute = await Route.findByIdAndUpdate(
      route._id,
      updateData,
      { new: true }
    );

    // Also update collector status
    if (route.collectorId) {
      const userStatus = status === 'in_progress' ? 'active' : status === 'completed' ? 'idle' : 'assigned';
      await User.findByIdAndUpdate(route.collectorId, { status: userStatus });
    }

    // Award points for route optimization
    if (status === 'completed' && route.aiOptimized && route.collectorId) {
      await RewardTransaction.create({
        userId: route.collectorId,
        type: 'earned',
        amount: 30,
        description: 'Route Optimization Bonus',
        category: 'route_optimization',
        referenceId: route._id,
        referenceModel: 'Route'
      });

      await User.findByIdAndUpdate(route.collectorId, {
        $inc: { rewardPoints: 30 }
      });
    }

    // Emit socket update
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      if (io) {
        io.emit('collector-status-update', {
          routeId: route._id,
          routeCode: route.routeCode,
          status: updatedRoute.status,
          collectorId: route.collectorId
        });
      }
    } catch (sErr) {
      console.warn("Socket notification warning:", sErr.message);
    }

    res.json(updatedRoute);
  } catch (error) {
    console.error('Error updating route status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete waste collection
router.post('/collection', async (req, res) => {
  try {
    const { collectorId, area, route, wasteTypes, latitude, longitude, notes } = req.body;

    const collection = new WasteCollection({
      collectorId,
      area,
      route,
      wasteTypes,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude || 77.2090), parseFloat(latitude || 28.6139)]
      },
      notes,
      status: 'completed',
      completedAt: new Date(),
      rewardPoints: 20
    });

    await collection.save();

    // Award points to collector
    await RewardTransaction.create({
      userId: collectorId,
      type: 'earned',
      amount: 20,
      description: 'Waste Collection',
      category: 'daily_pickup',
      referenceId: collection._id,
      referenceModel: 'WasteCollection'
    });

    await User.findByIdAndUpdate(collectorId, {
      $inc: { rewardPoints: 20 }
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error('Collection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get route details
router.get('/route/:routeId', async (req, res) => {
  try {
    let route;
    if (mongoose.Types.ObjectId.isValid(req.params.routeId)) {
      route = await Route.findById(req.params.routeId).populate('collectorId', 'username');
    }
    if (!route) {
      route = await Route.findOne({ routeCode: req.params.routeId }).populate('collectorId', 'username');
    }

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json(route);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get collection history
router.get('/collections/:userId', async (req, res) => {
  try {
    const collections = await WasteCollection.find({ collectorId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

module.exports = router;
