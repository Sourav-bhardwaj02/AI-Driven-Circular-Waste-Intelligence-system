let io;

const initSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

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

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO
};
