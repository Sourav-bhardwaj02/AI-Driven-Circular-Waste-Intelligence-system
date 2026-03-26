require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
      health: '/api/health'
    }
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`👥 Citizen API: http://localhost:${PORT}/api/citizen`);
  console.log(`🚛 Collector API: http://localhost:${PORT}/api/collector`);
});

module.exports = app;