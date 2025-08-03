"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";

const allowedResolutions = [
  [720, 1280],
  [1080, 1920],
  [1080, 2340],
  [1080, 2400],
  [1170, 2532],
  [1290, 2796],
  [1440, 2960],
  [1440, 3088],
  [1440, 3120],
  [1440, 3200],
  [1440, 3216],
  [1812, 2176],
  [1080, 2640],
  [1840, 2208],
  [2480, 2200],
  [2944, 6384],
  [2432, 4320],
  [3120, 4160],
  [3950, 5925],
  [3456, 5184],
  [2432, 3648],
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

      setMessage(`✅ Uploaded successfully! Public ID: ${response.data.public_id}`);
      setTitle("");
      setFile(null);
    } catch (error: any) {
      console.error("Upload failed:", error);
      const errorMsg = error?.response?.data?.error || "Unknown error";
      const received = error?.response?.data?.received;
      const allowedList = error?.response?.data?.allowed;

      let detailedMessage = `❌ Upload failed: ${errorMsg}`;

      if (received && allowedList) {
        detailedMessage += `\nReceived: ${received}\nAllowed: ${allowedList.join(", ")}`;
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
      <div className="max-w-lg mx-auto mt-8 p-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">📤 Upload Wallpaper</h2>

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
          <h3 className="text-lg font-semibold mb-2">📏 Accepted Resolutions</h3>
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
