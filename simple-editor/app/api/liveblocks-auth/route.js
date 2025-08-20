import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

// ✅ Initialize Liveblocks with your secret key
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

export async function POST() {
  try {
    // ✅ Get the current logged-in user from Clerk
    const user = await currentUser();

    if (!user) {
      console.warn("❌ No user found, unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // ✅ Generate a unique color for each user based on their ID
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
    
    // Use a simple hash function to assign a consistent color to each user
    const getUserColor = (userId) => {
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    // ✅ Create a new Liveblocks session
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous",
        avatar: user.imageUrl || "",
        email: user.emailAddresses?.[0]?.emailAddress || undefined,
        color: getUserColor(userId), // ✅ Assign unique color to each user
      },
    });

    // ✅ Allow the user to access ALL rooms (you can restrict by room ID if needed)
    session.allow("*", session.FULL_ACCESS);

    // ✅ Authorize and generate a response
    const { status, body } = await session.authorize();

    return new NextResponse(body, { status });
  } catch (err) {
    console.error("🔥 Liveblocks Auth Error:", err);
    return NextResponse.json(
      { error: "Failed to create Liveblocks token" },
      { status: 500 }
    );
  }
}
