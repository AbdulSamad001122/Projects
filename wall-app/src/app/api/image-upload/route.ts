// This tells Next.js to use the Node.js runtime for App Router
export const runtime = "nodejs";

import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import Wallpaper from "@/models/Wallpaper";
import { connectDB } from "@/lib/connectDB";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import imageSize from "image-size";

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Ensure DB is connected
connectDB();

// ✅ POST handler
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  let firstName: string | undefined = undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user_detail = await clerkClient.users.getUser(userId);
  firstName = user_detail.firstName ?? undefined;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title");

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    // ✅ Check file size (max 30MB)
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum allowed size is 30MB." },
        { status: 413 }
      );
    }

    // ✅ Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Get image dimensions
    const dimensions = imageSize(buffer);
    const { width, height } = dimensions;

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
      [1842, 4096],
    ];

    console.log("Image dimensions received:", width, height);

    // ✅ Validate resolution
    const isAllowed = allowedResolutions.some(
      ([w, h]) => w === width && h === height
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: "Only standard mobile wallpaper resolutions are allowed.",
          received: `${width}x${height}`,
          allowed: allowedResolutions.map(([w, h]) => `${w}x${h}`),
        },
        { status: 400 }
      );
    }

    // ✅ Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "wall-app" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const { secure_url, public_id } = result;

    // ✅ Save to MongoDB
    const newWallpaper = await Wallpaper.create({
      title,
      image_detail: {
        public_id,
        secure_url,
      },
      user_detail: {
        user_clerk_Id: userId,
        user_firstname: firstName,
      },
    });

    await newWallpaper.save();

    return NextResponse.json({ public_id }, { status: 200 });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload image failed" }, { status: 500 });
  }
}
