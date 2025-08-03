import { promises as fs } from "fs";

export const fileDeletorFromTempFolder = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log("🗑️ Temp file deleted:", filePath);
  } catch (err) {
    console.error("❌ Failed to delete temp file:", err.message);
  }
};

