// config/db.js
// Handles the MongoDB connection using Mongoose.
// Called once at server startup.

const mongoose = require("mongoose");

/**
 * connectDB - connects to MongoDB using the URI from environment variables.
 * Exits the process if connection fails (fail-fast pattern).
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Exit with failure so the OS / process manager knows something went wrong
    process.exit(1);
  }
};

module.exports = connectDB;
