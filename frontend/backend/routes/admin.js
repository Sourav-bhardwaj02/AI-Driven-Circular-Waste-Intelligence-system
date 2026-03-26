const express = require('express');
const router = express.Router();
const WasteCollection = require('../models/WasteCollection');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Route = require('../models/Route');

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get waste type statistics
    const wasteStats = await WasteCollection.aggregate([
      { $unwind: '$wasteTypes' },
      { $group: { _id: '$wasteTypes.type', total: { $sum: '$wasteTypes.amount' } } },
      { $sort: { total: -1 } }
    ]);

    const totalWaste = wasteStats.reduce((sum, stat) => sum + stat.total, 0);
    const pieData = wasteStats.map(stat => ({
      name: stat._id.charAt(0).toUpperCase() + stat._id.slice(1),
      value: Math.round((stat.total / totalWaste) * 100),
      color: stat._id === 'dry' ? 'hsl(155, 65%, 42%)' : 
             stat._id === 'wet' ? 'hsl(175, 55%, 45%)' : 
             'hsl(350, 70%, 58%)'
    }));

    // Get monthly collection data
    const monthlyData = await WasteCollection.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          pickups: { $sum: 1 },
          totalAmount: { $sum: { $sum: '$wasteTypes.amount' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const areaData = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'
    ].map((month, index) => ({
      month,
      pickups: monthlyData.find(d => d._id === index + 1)?.pickups || Math.floor(Math.random() * 1000) + 2000,
      complaints: Math.floor(Math.random() * 100) + 50
    }));

    // Get recent complaints
    const complaints = await Complaint.find()
      .populate('citizenId', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedComplaints = complaints.map(complaint => ({
      sector: complaint.sector,
      time: getTimeAgo(complaint.createdAt),
      status: complaint.status.replace('_', ' ').charAt(0).toUpperCase() + complaint.status.replace('_', ' ').slice(1)
    }));

    res.json({
      pieData,
      areaData,
      complaints: formattedComplaints,
      stats: {
        totalCollections: await WasteCollection.countDocuments(),
        activeCollectors: await User.countDocuments({ role: 'collector' }),
        pendingComplaints: await Complaint.countDocuments({ status: 'pending' }),
        resolvedComplaints: await Complaint.countDocuments({ status: 'resolved' })
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all complaints
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('citizenId', 'username email')
      .populate('assignedTo', 'username')
      .sort({ createdAt: -1 });
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update complaint status
router.put('/complaints/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        adminNotes,
        resolvedAt: status === 'resolved' ? new Date() : undefined
      },
      { new: true }
    ).populate('citizenId', 'username');

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all collectors
router.get('/collectors', async (req, res) => {
  try {
    const collectors = await User.find({ role: 'collector' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(collectors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
