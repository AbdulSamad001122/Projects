import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextResponse } from "next/server";

// ✅ Use `context` instead of destructuring `params` directly
export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

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
