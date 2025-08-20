import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// ✅ Color palette for consistent user colors
const colors = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
  "#F7DC6F", // Light Yellow
  "#BB8FCE", // Light Purple
  "#85C1E9", // Light Blue
  "#F8C471", // Orange
  "#82E0AA", // Light Green
];

// ✅ Generate consistent color for each user
const getUserColor = (userId) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export async function POST(req) {
  try {
    const { userIds } = await req.json();

    let users = [];

    if (!userIds || userIds.length === 0) {
      // ✅ Fetch all users (for mentions)
      const result = await clerkClient.users.getUserList();
      users = result.data;
    } else {
      // ✅ Fetch each user by ID using getUserList
      const results = await Promise.all(
        userIds.map(async (id) => {
          try {
            const res = await clerkClient.users.getUserList({ userId: [id] });
            return res.data[0] || null;
          } catch (e) {
            console.warn(`⚠️ Could not fetch user ${id}:`, e);
            return null;
          }
        })
      );
      users = results.filter(Boolean);
    }

    const formatted = users.map((u) => ({
      id: u.id,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Anonymous",
      avatar: u.imageUrl || "",
      email: u.emailAddresses?.[0]?.emailAddress || "",
      color: getUserColor(u.id), // ✅ Add consistent color for each user
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("🔥 Clerk resolve-users error:", err);
    return NextResponse.json(
      { error: "Failed to resolve users" },
      { status: 500 }
    );
  }
}
