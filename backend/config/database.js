const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  // 1. Try Primary MongoDB URI (e.g. Atlas) with a 4-second timeout
  if (mongoUri && !mongoUri.includes('localhost') && !mongoUri.includes('127.0.0.1')) {
    try {
      console.log('🔄 Attempting MongoDB Atlas connection...');
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 4000
      });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn('⚠️ MongoDB Atlas connection failed (IP whitelist or unreachable):', error.message || error);
    }
  }

  // 2. Try Local MongoDB connection
  try {
    console.log('🔄 Attempting local MongoDB connection (mongodb://localhost:27017/wastewise)...');
    const localConn = await mongoose.connect('mongodb://localhost:27017/wastewise', {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`✅ Local MongoDB Connected: ${localConn.connection.host}`);
    return localConn;
  } catch (localErr) {
    console.warn('⚠️ Local MongoDB not running.');
  }

  // 3. Start Embedded In-Memory MongoDB Server so backend is 100% functional
  try {
    console.log('🔄 Starting In-Memory MongoDB Server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const memConn = await mongoose.connect(uri);
    console.log(`✅ In-Memory MongoDB Connected: ${uri}`);
    return memConn;
  } catch (memErr) {
    console.error('⚠️ In-Memory MongoDB failed to start:', memErr.message || memErr);
    return null;
  }
};

module.exports = connectDB;
