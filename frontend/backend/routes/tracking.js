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
      location: { $exists: true }
    })
    .select('username profile.firstName profile.lastName location rewardPoints')
    .populate('assignedRoute', 'routeCode name status areas');

    res.json({
      success: true,
      data: collectors
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

module.exports = router;
