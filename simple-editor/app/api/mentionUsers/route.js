// app/api/users/route.js
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const users = await clerkClient.users.getUserList(); // fetch all Clerk users
    const mapped = users.data.map((u) => ({
      id: u.id,
      name: u.fullName || "Anonymous",
      avatar: u.imageUrl,
    }));
    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Error fetching Clerk users:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
