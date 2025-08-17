import { NextResponse } from "next/server";
import { createClient } from "@liveblocks/server";

const liveblocksClient = createClient({
  secret: process.env.LIVEBLOCKS_SECRET_KEY, // must be set in .env.local
});

export async function POST(req) {
  try {
    const { userId } = await req.json();

    // Give permissions using "*" for all rooms (or specify rooms)
    const token = await liveblocksClient.getClientSession({
      userId,
      permissions: ["*"], 
    });

    return NextResponse.json({ token });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
