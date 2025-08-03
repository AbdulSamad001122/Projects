import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Debug: Check if environment variables are loaded
console.log("Cloudinary Config Check:");
console.log(
  "CLOUDINARY_CLOUD_NAME:",
  process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Not Set"
);
console.log(
  "CLOUDINARY_API_KEY:",
  process.env.CLOUDINARY_API_KEY ? "Set" : "Not Set"
);
console.log(
  "CLOUDINARY_SECRET_KEY:",
  process.env.CLOUDINARY_SECRET_KEY ? "Set" : "Not Set"
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.log("Error uploading to cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary };
