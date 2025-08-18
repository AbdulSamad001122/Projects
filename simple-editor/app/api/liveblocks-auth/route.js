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

    // ✅ Create a new Liveblocks session
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous",
        picture: user.imageUrl || undefined,
        email: user.emailAddresses?.[0]?.emailAddress || undefined,
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
