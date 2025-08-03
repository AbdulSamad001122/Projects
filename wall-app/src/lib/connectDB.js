// 1. Import mongoose
import mongoose from "mongoose";

// 2. Create an async function to connect to MongoDB
const connectDB = async () => {
  // ✅ If already connected, no need to reconnect again
  if (mongoose.connections[0].readyState) return;

  try {
    // 3. Connect to MongoDB using connection string from .env
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "wallpaper-app", // ✅ This is the specific DB name you want to use
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
};

// 4. Export the function so it can be reused in other files
export {
  connectDB
}
