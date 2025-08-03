const mongoose = require("mongoose");

const wallpaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    image_detail: {
      public_id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
    user_detail: {
      user_clerk_Id: {
        type: String,
        required: true,
      },
      user_firstname: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true, // ✅ Correct spelling
    collection: "wallpapers", // ✅ Correct place to set collection name
  }
);

// Prevent model overwrite error in Next.js dev mode
const Wallpaper =
  mongoose.models.Wallpaper || mongoose.model("Wallpaper", wallpaperSchema);

module.exports = Wallpaper;
