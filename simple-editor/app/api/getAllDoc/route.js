import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("userId"); // Clerk ID coming from frontend

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 400 });
    }

    // Step 1: Find the user in Prisma by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { docs: true }, // 👈 directly include docs here
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(user.docs);
    
    // Step 2: Return all docs (they’re already inside `user.docs`)
    return NextResponse.json(user.docs);
  } catch (error) {
    console.error("Error in getAllDoc API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
