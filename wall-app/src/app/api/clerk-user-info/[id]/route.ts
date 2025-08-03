import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

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
