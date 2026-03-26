const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Route = require('../models/Route');
const WasteCollection = require('../models/WasteCollection');
const Grievance = require('../models/Grievance');
const auth = require('../middleware/auth');
const Complaint = require('../models/Complaint');

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// AI-driven route optimization using nearest neighbor algorithm
const optimizeRoute = (startPoint, locations, maxDistance = 50) => {
  if (!locations || locations.length === 0) return [];

  let unvisited = locations.filter(loc => {
    const distance = calculateDistance(
      startPoint[1], startPoint[0],
      loc.coordinates.coordinates[1], loc.coordinates.coordinates[0]
    );
    return distance <= maxDistance;
  });

  if (unvisited.length === 0) return [];

  const optimizedRoute = [];
  let currentPoint = startPoint;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    // Find nearest unvisited location
    unvisited.forEach((location, index) => {
      const distance = calculateDistance(
        currentPoint[1], currentPoint[0],
        location.coordinates.coordinates[1], location.coordinates.coordinates[0]
      );
      
      // Add priority weighting (higher priority = lower effective distance)
      const effectiveDistance = distance - (location.priority || 0) * 0.1;
      
      if (effectiveDistance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    const nextLocation = unvisited[nearestIndex];
    optimizedRoute.push(nextLocation);
    totalDistance += minDistance;
    currentPoint = nextLocation.coordinates.coordinates;
    unvisited.splice(nearestIndex, 1);
  }

  return {
    route: optimizedRoute,
    totalDistance: Math.round(totalDistance * 100) / 100,
    estimatedTime: Math.round((totalDistance / 40) * 60), // Assuming 40 km/h average speed
    stops: optimizedRoute.length
  };
};

// @route   GET /api/tracking/collectors
// @desc    Get all active collectors with their current locations
router.get('/collectors', async (req, res) => {
  try {
    const collectors = await User.find({ 
      role: 'collector',
      isActive: true 
    })
    .select('username email currentLocation vehicleNumber profile.phone status lastLocationUpdate profile.firstName profile.lastName');

    // Format collector data for frontend
    const formattedCollectors = collectors.map(collector => ({
      id: collector._id,
      username: collector.username,
      displayName: collector.profile?.firstName && collector.profile?.lastName 
        ? `${collector.profile.firstName} ${collector.profile.lastName}` 
        : collector.username,
      email: collector.email,
      latitude: collector.currentLocation?.coordinates?.[1] || 28.6139,
      longitude: collector.currentLocation?.coordinates?.[0] || 77.2090,
      status: collector.status || 'active',
      currentRoute: null,
      vehicleNumber: collector.vehicleNumber,
      phone: collector.profile?.phone,
      lastLocationUpdate: collector.lastLocationUpdate || new Date(),
      routeInfo: null
    }));

    res.json({
      success: true,
      data: {
        collectors: formattedCollectors,
        total: formattedCollectors.length,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching collectors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tracking/location
// @desc    Update user's current location
router.put('/location', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    await User.findByIdAndUpdate(userId, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      lastLocationUpdate: new Date()
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tracking/collectors/:id/location
// @desc    Update collector's current location
router.put('/collectors/:id/location', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, status } = req.body;
    const userId = req.user.id;

    // Check if user is updating their own location or is admin
    if (id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this collector location'
      });
    }

    // Find and update collector
    const collector = await User.findById(id).select('username profile.firstName profile.lastName currentLocation vehicleNumber profile.phone status');
    if (!collector || collector.role !== 'collector') {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    // Update location
    collector.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    collector.lastLocationUpdate = new Date();
    
    if (status) {
      collector.status = status;
    }

    await collector.save();

    // Emit real-time update via socket
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
      io.emit('collector-location-update', {
        id: collector._id,
        username: collector.username,
        displayName: collector.profile?.firstName && collector.profile?.lastName 
          ? `${collector.profile.firstName} ${collector.profile.lastName}` 
          : collector.username,
        latitude,
        longitude,
        status: collector.status || 'active',
        currentRoute: null,
        vehicleNumber: collector.vehicleNumber,
        lastLocationUpdate: collector.lastLocationUpdate
      });
    }

    res.json({
      success: true,
      data: {
        id: collector._id,
        latitude,
        longitude,
        status: collector.status || 'active',
        lastLocationUpdate: collector.lastLocationUpdate
      }
    });
  } catch (error) {
    console.error('Error updating collector location:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tracking/nearby/:userId
// @desc    Find nearby collectors for a citizen
router.get('/nearby/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { maxDistance = 10 } = req.query;

    const user = await User.findById(userId);
    if (!user || !user.location) {
      return res.status(404).json({
        success: false,
        message: 'User not found or location not set'
      });
    }

    const nearbyCollectors = await User.find({
      role: 'collector',
      location: {
        $near: {
          $geometry: user.location,
          $maxDistance: parseFloat(maxDistance) * 1000 // Convert km to meters
        }
      }
    })
    .select('username profile.firstName profile.lastName location')
    .limit(5);

    res.json({
      success: true,
      data: nearbyCollectors
    });
  } catch (error) {
    console.error('Error finding nearby collectors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tracking/optimize-route/my-route
// @desc    Get optimized route for the current collector
router.get('/optimize-route/my-route', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the route assigned to this collector
    const route = await Route.findOne({ collectorId: userId });
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'No route assigned to this collector'
      });
    }

    // Get waste locations for this route
    const wasteCollections = await WasteCollection.find({
      route: route.routeCode,
      status: { $in: ['pending', 'in_progress'] }
    }).select('area location status wasteTypes estimatedTime');

    const grievances = await Grievance.find({
      assignedTo: userId,
      status: { $in: ['Pending', 'In Progress'] }
    }).select('location category priority');

    // Create optimization points
    const locations = [
      ...wasteCollections.map(c => ({
        type: 'collection',
        id: c._id,
        area: c.area,
        coordinates: c.location.coordinates,
        priority: 2, // Collections have medium priority
        estimatedTime: c.estimatedTime || 15,
        wasteTypes: c.wasteTypes
      })),
      ...grievances.map(g => ({
        type: 'grievance',
        id: g._id,
        area: g.location,
        coordinates: g.coordinates,
        priority: g.priority || 3,
        estimatedTime: 10,
        category: g.category
      }))
    ];

    // Use the collector's current location as starting point
    const startPoint = route.checkpoints && route.checkpoints.length > 0 
      ? route.checkpoints[0].coordinates 
      : [77.2090, 28.6139]; // Default Delhi coordinates

    // Optimize route
    const optimizedPoints = optimizeRoute(startPoint, locations);

    // Create response data
    const optimizedRoute = {
      routeCode: route.routeCode,
      name: route.name,
      waypoints: optimizedPoints.map((point, index) => ({
        id: point.id,
        coordinates: point.coordinates,
        area: point.area,
        estimatedTime: point.estimatedTime,
        order: index + 1
      })),
      totalTime: optimizedPoints.reduce((total, point) => total + point.estimatedTime, 0),
      totalDistance: optimizedPoints.reduce((total, point, index) => {
        if (index === 0) return 0;
        return total + calculateDistance(
          optimizedPoints[index - 1].coordinates[1], optimizedPoints[index - 1].coordinates[0],
          point.coordinates[1], point.coordinates[0]
        );
      }, 0)
    };

    res.json({
      success: true,
      data: optimizedRoute
    });
  } catch (error) {
    console.error('Error optimizing my route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tracking/optimize-route/:routeId
// @desc    Optimize route for a collector using AI algorithm
router.get('/optimize-route/:routeId', auth, async (req, res) => {
  try {
    const routeId = req.params.routeId;
    const userId = req.user.id;

    // Get the route
    const route = await Route.findById(routeId).populate('assignedCollector');
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check if user is assigned to this route or is admin
    const user = await User.findById(userId);
    if (user.role !== 'admin' && 
        (!route.assignedCollector || route.assignedCollector._id.toString() !== userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to optimize this route'
      });
    }

    // Get all pending collections and grievances in route areas
    const routeAreas = route.areas.map(area => area.name);
    
    const [collections, grievances] = await Promise.all([
      WasteCollection.find({
        area: { $in: routeAreas },
        status: { $in: ['pending', 'assigned'] }
      }).populate('citizenId', 'profile.firstName profile.lastName location'),
      
      Grievance.find({
        location: { $in: routeAreas },
        status: { $in: ['Pending', 'In Progress'] }
      }).populate('citizenId', 'profile.firstName profile.lastName location')
    ]);

    // Combine all locations with priorities
    const locations = [
      ...collections.map(c => ({
        type: 'collection',
        id: c._id,
        area: c.area,
        coordinates: c.citizenId?.location || { type: 'Point', coordinates: [77.2090, 28.6139] },
        priority: 1, // Collections have medium priority
        estimatedTime: c.estimatedTime || 15,
        wasteTypes: c.wasteTypes,
        citizen: c.citizenId
      })),
      ...grievances.map(g => ({
        type: 'grievance',
        id: g._id,
        area: g.location,
        coordinates: g.coordinates,
        priority: 3, // Grievances have high priority
        estimatedTime: 10,
        category: g.category,
        citizen: g.citizenId
      }))
    ];
    
    // Sort by priority first (complaints with high priority)
    allPoints.sort((a, b) => {
      if (a.type === 'complaint' && b.type !== 'complaint') return -1;
      if (a.type !== 'complaint' && b.type === 'complaint') return 1;
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return 0;
    });
    
    // Optimize the route
    const optimizedPoints = optimizeRoute(allPoints);
    
    // Update route with optimized checkpoints
    route.optimizedCheckpoints = optimizedPoints;
    route.aiOptimized = true;
    route.optimizationDate = new Date();
    await route.save();
    
    res.json({
      success: true,
      data: {
        optimizedRoute: optimizedPoints,
        totalDistance: optimizedPoints.reduce((total, point, index) => {
          if (index === 0) return 0;
          return total + calculateDistance(
            optimizedPoints[index - 1].latitude,
            optimizedPoints[index - 1].longitude,
            point.latitude,
            point.longitude
          );
        }, 0),
        estimatedTime: optimizedPoints.length * 15 // 15 minutes per stop
      }
    });
  } catch (error) {
    console.error('Error optimizing route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tracking/heatmap
// @desc    Get waste density heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const complaints = await Complaint.find({
      location: { $exists: true }
    }).select('location status priority');
    
    const collections = await WasteCollection.find({
      location: { $exists: true }
    }).select('location status wasteTypes');
    
    // Create heatmap data points
    const heatmapPoints = [
      ...complaints.map(c => ({
        latitude: c.location.coordinates[1],
        longitude: c.location.coordinates[0],
        intensity: c.priority === 'high' ? 0.9 : c.priority === 'medium' ? 0.6 : 0.3,
        type: 'complaint',
        status: c.status
      })),
      ...collections.map(c => ({
        latitude: c.location.coordinates[1],
        longitude: c.location.coordinates[0],
        intensity: c.wasteTypes.reduce((sum, wt) => sum + wt.amount, 0) / 100,
        type: 'collection',
        status: c.status
      }))
    ];
    
    res.json({
      success: true,
      data: heatmapPoints
    });
  } catch (error) {
    console.error('Error generating heatmap:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tracking/waste-locations
// @desc    Get all waste collection locations
router.get('/waste-locations', auth, async (req, res) => {
  try {
    // Get waste collections and grievances
    const wasteCollections = await WasteCollection.find({
      status: { $in: ['pending', 'in_progress'] }
    }).populate('collectorId', 'username');

    const grievances = await Grievance.find({
      status: { $in: ['Pending', 'In Progress'] }
    }).populate('citizenId', 'username profile.firstName profile.lastName');

    // Combine and format locations
    const locations = [
      ...wasteCollections.map(wc => ({
        id: wc._id.toString(),
        area: wc.area,
        coordinates: wc.location.coordinates,
        status: wc.status,
        wasteTypes: wc.wasteTypes,
        priority: 'medium',
        estimatedTime: 15,
        assignedCollector: wc.collectorId?.username,
        type: 'collection'
      })),
      ...grievances.map(g => ({
        id: g._id.toString(),
        area: g.location,
        coordinates: g.coordinates.coordinates,
        status: g.status.toLowerCase() === 'pending' ? 'pending' : 'in_progress',
        wasteTypes: [{ type: g.category, amount: 10 }],
        priority: g.priority <= 2 ? 'high' : g.priority <= 4 ? 'medium' : 'low',
        estimatedTime: 20,
        assignedCollector: g.assignedCollector,
        type: 'grievance',
        citizen: g.citizenId
      }))
    ];

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching waste locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waste locations'
    });
  }
});

// @route   POST /api/tracking/collect-waste/:id
// @desc    Start collecting waste from a location
router.post('/collect-waste/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const collectorId = req.user.id;

    // Update waste collection status
    const collection = await WasteCollection.findByIdAndUpdate(
      id,
      { 
        status: 'in_progress',
        collectorId: collectorId,
        startedAt: new Date()
      },
      { new: true }
    ).populate('collectorId', 'username');

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Waste collection not found'
      });
    }

    // Emit real-time update
    req.io.emit('collection-status-update', {
      id: collection._id,
      status: 'in_progress',
      collectorId: collectorId
    });

    res.json({
      success: true,
      data: collection,
      message: 'Waste collection started'
    });
  } catch (error) {
    console.error('Error collecting waste:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start waste collection'
    });
  }
});

// @route   POST /api/tracking/complete-waste/:id
// @desc    Complete waste collection from a location
router.post('/complete-waste/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const collectorId = req.user.id;

    // Update waste collection status
    const collection = await WasteCollection.findByIdAndUpdate(
      id,
      { 
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Waste collection not found'
      });
    }

    // Update collector's reward points
    await User.findByIdAndUpdate(collectorId, {
      $inc: { rewardPoints: collection.rewardPoints || 20 }
    });

    // Emit real-time update
    req.io.emit('collection-status-update', {
      id: collection._id,
      status: 'completed',
      collectorId: collectorId
    });

    res.json({
      success: true,
      data: collection,
      message: 'Waste collection completed'
    });
  } catch (error) {
    console.error('Error completing waste:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete waste collection'
    });
  }
});

// @route   POST /api/tracking/update-location
// @desc    Update collector's current location (for real-time tracking)
router.post('/update-location', auth, async (req, res) => {
  try {
    const { latitude, longitude, status } = req.body;
    const collectorId = req.user.id;

    // Update user location
    await User.findByIdAndUpdate(collectorId, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    // Emit real-time location update
    const user = await User.findById(collectorId).select('username role assignedRoute');
    const route = await Route.findById(user.assignedRoute).select('routeCode name');
    
    req.io.emit('collector-location-update', {
      id: collectorId,
      username: user.username,
      latitude,
      longitude,
      status: status || 'active',
      currentRoute: route?.routeCode || null
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// @route   GET /api/tracking/collectors
// @desc    Get all collectors with their locations and stats
router.get('/collectors', auth, async (req, res) => {
  try {
    // Get all collectors
    const collectors = await User.find({ role: 'collector' })
      .select('username profile.firstName profile.lastName location assignedRoute')
      .populate('assignedRoute', 'routeCode name status');

    // Get collection stats for each collector
    const collectorsWithStats = await Promise.all(
      collectors.map(async (collector) => {
        const completedCount = await WasteCollection.countDocuments({
          collectorId: collector._id,
          status: 'completed'
        });
        
        const pendingCount = await WasteCollection.countDocuments({
          collectorId: collector._id,
          status: 'pending'
        });

        const inProgressCount = await WasteCollection.countDocuments({
          collectorId: collector._id,
          status: 'in_progress'
        });

        return {
          id: collector._id,
          username: collector.username,
          status: inProgressCount > 0 ? 'in_progress' : pendingCount > 0 ? 'active' : 'idle',
          currentLocation: collector.location ? {
            latitude: collector.location.coordinates[1],
            longitude: collector.location.coordinates[0]
          } : undefined,
          currentRoute: collector.assignedRoute?.routeCode || null,
          completedCollections: completedCount,
          totalCollections: completedCount + pendingCount + inProgressCount,
          estimatedTimeRemaining: pendingCount * 15 // Estimate 15 mins per collection
        };
      })
    );

    res.json({
      success: true,
      data: {
        collectors: collectorsWithStats,
        total: collectorsWithStats.length
      }
    });
  } catch (error) {
    console.error('Error fetching collectors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collectors'
    });
  }
});

module.exports = router;
