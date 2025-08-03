import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextRequest, NextResponse } from "next/server";

// ✅ Correct way to access dynamic route params in App Router
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const userId = context.params.id;

  try {
    const user = await clerkClient.users.getUser(userId);

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
