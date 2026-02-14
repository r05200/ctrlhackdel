/**
 * Database connection and initialization
 */
const mongoose = require('mongoose');
const config = require('../config');

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
    console.log('✓ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('✗ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('✗ Failed to disconnect from MongoDB:', error.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB
};
