import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // gets the [id] part

  if (!id) {
    return NextResponse.json({ error: "User ID is missing" }, { status: 400 });
  }

  try {
    const user = await clerkClient.users.getUser(id);
    return NextResponse.json({
      imageUrl: user.imageUrl,
    });
  } catch (error) {
    console.error("❌ Failed to fetch user from Clerk:", error);
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: 500 }
    );
  }
}
