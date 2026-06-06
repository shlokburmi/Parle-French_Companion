import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    // DO NOT process.exit(1) here! It crashes Vercel serverless functions.
  }
};

export default connectDB;
