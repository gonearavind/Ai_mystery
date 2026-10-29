import mongoose from 'mongoose';
import { MONGODB_URI } from './env.js';
import logger from '../utils/logger.js';

let isConnected = false;

// Register Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info(`[MongoDB] Connected to database: ${mongoose.connection.host}`);
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  logger.error(`[MongoDB] Connection error: ${err.message}`, { error: err });
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('[MongoDB] Reconnected to database.');
});

/**
 * Connect to MongoDB with production-grade pooling and timeout settings.
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 15,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    });
    isConnected = true;
    return conn;
  } catch (error) {
    isConnected = false;
    logger.error(`[MongoDB] Initial connection failed: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Cleanly disconnect from MongoDB (used for graceful shutdown).
 */
export async function disconnectDB() {
  try {
    await mongoose.connection.close(false);
    isConnected = false;
    logger.info('[MongoDB] Connection closed gracefully.');
  } catch (err) {
    logger.error(`[MongoDB] Error during disconnect: ${err.message}`, { error: err });
  }
}

/**
 * Returns true if MongoDB connection is ready.
 */
export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export default connectDB;
