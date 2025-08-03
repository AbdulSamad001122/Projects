import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("🌐 Connecting to MongoDB:", process.env.MONGODB_URI);
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      `✅ MongoDB connected! Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("❌ MongoDB connection failed");
    throw error; // let index.js handle it
  }
};

export default connectDB;
