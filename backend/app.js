require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const http = require('http');
const socketIo = require('socket.io');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join rooms based on user role
  socket.on('join-collector-room', (userId) => {
    socket.join(`collector-${userId}`);
    console.log(`🚛 Collector ${userId} joined room`);
  });

  socket.on('join-tracking-room', () => {
    socket.join('tracking-room');
    console.log(`👁️ User joined tracking room`);
  });

  // Handle real-time location updates
  socket.on('location-update', (data) => {
    socket.broadcast.emit('collector-location-update', data);
  });

  // Handle waste collection updates
  socket.on('waste-collection-update', (data) => {
    socket.to('tracking-room').emit('collection-status-update', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/citizen', require('./routes/citizen'));
app.use('/api/collector', require('./routes/collector'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/grievance', require('./routes/grievance'));
app.use('/api/profile', require('./routes/profile'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'WasteWise API Server',
    version: '1.0.0',
    endpoints: {
      admin: '/api/admin',
      citizen: '/api/citizen',
      collector: '/api/collector',
      tracking: '/api/tracking',
      health: '/api/health'
    },
    features: ['Live Tracking', 'Route Optimization', 'Real-time Updates']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`👥 Citizen API: http://localhost:${PORT}/api/citizen`);
  console.log(`🚛 Collector API: http://localhost:${PORT}/api/collector`);
  console.log(`📍 Tracking API: http://localhost:${PORT}/api/tracking`);
  console.log(`🔌 Socket.IO enabled for real-time updates`);
});

module.exports = app;