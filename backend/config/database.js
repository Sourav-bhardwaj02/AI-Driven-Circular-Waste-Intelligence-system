const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wastewise';
  
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn('⚠️ Primary MongoDB connection failed:', error.message || error);
    
    try {
      console.log('🔄 Attempting local MongoDB connection (mongodb://localhost:27017/wastewise)...');
      const localConn = await mongoose.connect('mongodb://localhost:27017/wastewise');
      console.log(`✅ Local MongoDB Connected: ${localConn.connection.host}`);
      return localConn;
    } catch (localErr) {
      console.error('⚠️ All MongoDB connections failed. Backend running without DB connection.');
      return null;
    }
  }
};

module.exports = connectDB;
