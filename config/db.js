import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/premium-ecommerce';
    console.log(`[Database] Connecting to MongoDB...`);
    const conn = await mongoose.connect(connStr);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    console.warn(`[Database] Ensure MongoDB is running locally on port 27017 or provide a MONGO_URI.`);
    // In a demo/production, we can also fail gracefully or mock Mongoose operations,
    // but we will let standard connection fail so user can configure environment correctly.
    process.exit(1);
  }
};
