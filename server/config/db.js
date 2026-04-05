// ============================================
// server/config/db.js — MongoDB Connection
// ============================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in your .env file');
    }

    // Mongoose connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if can't connect
      socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.error('');
    console.error('👉 Troubleshooting Tips:');
    console.error('   1. Make sure MongoDB is running locally, OR');
    console.error('   2. Set a valid Atlas connection string in your .env file');
    console.error('   3. Check that MONGO_URI is set in your .env file');
    console.error('');
    process.exit(1); // Exit app on DB connection failure
  }
};

module.exports = connectDB;
