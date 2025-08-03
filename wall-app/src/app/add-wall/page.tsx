"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import WrapButton from "@/components/ui/wrap-button";
import { Globe } from "lucide-react";


const allowedResolutions = [
  [720, 1280],     // HD (older/small phones)
  [750, 1334],     // iPhone SE, 6, 7, 8
  [828, 1792],     // iPhone XR
  [1080, 1920],    // Full HD (standard)
  [1080, 2160],    // 18:9 Androids
  [1080, 2340],    // 19.5:9 Androids
  [1080, 2400],
  [1080, 2640],
  [1170, 2532],    // iPhone 12–15
  [1290, 2796],    // iPhone 15 Pro Max

  [1536, 2048],    // iPad Mini/Air
  [1668, 2388],    // iPad Pro 11"
  [2048, 2732],    // iPad Pro 12.9"
  [2560, 1600],    // Android tablets, MacBooks

  [1366, 768],     // Common laptop HD
  [1600, 900],     // HD+
  [1920, 1080],    // FHD
  [2048, 1152],
  [2560, 1440],    // QHD

  [2560, 1080],    // Ultrawide (21:9)
  [3440, 1440],    // Ultrawide QHD
  [3840, 1600],    // Ultrawide 4K+

  [3840, 2160],    // 4K UHD
  [3840, 2400],    // 4K+
  [5120, 2160],    // 5K Ultrawide
  [5120, 2880],    // 5K iMac
  [7680, 4320],    // 8K UHD
];


export default function UploadForm() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setMessage("");

    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!file || !title) {
      setMessage("❌ Please provide both title and a valid image.");
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);

      const response = await axios.post("/api/image-upload", formData);

      setMessage(
        `✅ Uploaded successfully! Public ID: ${response.data.public_id}`
      );
      setTitle("");
      setFile(null);
    } catch (error: any) {
      console.error("Upload failed:", error);
      const errorMsg = error?.response?.data?.error || "Unknown error";
      const received = error?.response?.data?.received;
      const allowedList = error?.response?.data?.allowed;

      let detailedMessage = `❌ Upload failed: ${errorMsg}`;

      if (received && allowedList) {
        detailedMessage += `\nReceived: ${received}\nAllowed: ${allowedList.join(
          ", "
        )}`;
      }

      setMessage(detailedMessage);
    } finally {
      setIsUploading(false);
      setTitle("");
      setFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black">
      <Navbar />
      <WrapButton className="mt-10" href="/show-wall">
        <Globe className="animate-spin " />
        See Wallpapers
      </WrapButton>
      <div className="max-w-lg mx-auto mt-8 p-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">
          📤 Upload Wallpaper
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-semibold mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border border-white/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Sunset Vibes"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold py-2 rounded"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-sm whitespace-pre-wrap">
            {message}
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">
            📏 Accepted Resolutions
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-collapse border border-white/10">
              <thead>
                <tr>
                  <th className="border border-white/10 px-2 py-1">Width</th>
                  <th className="border border-white/10 px-2 py-1">Height</th>
                </tr>
              </thead>
              <tbody>
                {allowedResolutions.map(([w, h], idx) => (
                  <tr key={idx}>
                    <td className="border border-white/10 px-2 py-1">{w}px</td>
                    <td className="border border-white/10 px-2 py-1">{h}px</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
