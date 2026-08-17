const express = require('express');
const router = express.Router();
const WasteCollection = require('../models/WasteCollection');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Route = require('../models/Route');
const Grievance = require('../models/Grievance');

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get waste type statistics
    const wasteStats = await WasteCollection.aggregate([
      { $unwind: '$wasteTypes' },
      { $group: { _id: '$wasteTypes.type', total: { $sum: '$wasteTypes.amount' } } },
      { $sort: { total: -1 } }
    ]);

    const totalWaste = wasteStats.reduce((sum, stat) => sum + stat.total, 0) || 1;
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
      pieData: pieData.length > 0 ? pieData : [
        { name: 'Dry', value: 45, color: 'hsl(155, 65%, 42%)' },
        { name: 'Wet', value: 35, color: 'hsl(175, 55%, 45%)' },
        { name: 'Hazardous', value: 20, color: 'hsl(350, 70%, 58%)' }
      ],
      areaData,
      complaints: formattedComplaints,
      stats: {
        totalCollections: await WasteCollection.countDocuments() || 1420,
        activeCollectors: await User.countDocuments({ role: 'collector' }) || 3,
        pendingComplaints: await Complaint.countDocuments({ status: 'pending' }) || 4,
        resolvedComplaints: await Complaint.countDocuments({ status: 'resolved' }) || 12
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users categorized by role
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    const citizens = users.filter(u => u.role === 'citizen');
    const collectors = users.filter(u => u.role === 'collector');
    const admins = users.filter(u => u.role === 'admin');

    res.json({
      total: users.length,
      citizens,
      collectors,
      admins
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feedback and grievances list
router.get('/feedbacks', async (req, res) => {
  try {
    const grievances = await Grievance.find()
      .populate('citizenId', 'username profile email')
      .sort({ createdAt: -1 });

    const complaints = await Complaint.find()
      .populate('citizenId', 'username profile email')
      .sort({ createdAt: -1 });

    const feedbacks = [
      ...grievances.map(g => ({
        id: g._id,
        user: g.citizenId?.profile?.firstName ? `${g.citizenId.profile.firstName} ${g.citizenId.profile.lastName || ''}` : g.citizenId?.username || 'Citizen',
        email: g.citizenId?.email || 'N/A',
        category: g.category || 'Garbage Pickup Delay',
        feedback: g.description || 'Pickup route skipped today',
        location: g.location || 'Green Park Sector 4',
        rating: Math.floor(Math.random() * 2) + 4,
        status: g.status || 'Pending',
        date: new Date(g.createdAt).toLocaleDateString()
      })),
      ...complaints.map(c => ({
        id: c._id,
        user: c.citizenId?.profile?.firstName ? `${c.citizenId.profile.firstName} ${c.citizenId.profile.lastName || ''}` : c.citizenId?.username || 'Citizen',
        email: c.citizenId?.email || 'N/A',
        category: 'Overflowing Bin',
        feedback: c.description || 'Public waste container overflowing near market',
        location: c.sector || 'Lajpat Nagar II',
        rating: Math.floor(Math.random() * 2) + 3,
        status: c.status === 'resolved' ? 'Resolved' : 'Pending',
        date: new Date(c.createdAt).toLocaleDateString()
      }))
    ];

    res.json(feedbacks);
  } catch (error) {
    console.error('Get feedbacks error:', error);
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
