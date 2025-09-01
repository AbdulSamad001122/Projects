import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const clientId = resolvedParams.id;
    
    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    // Find the specific client that belongs to the authenticated user
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        userId: dbUser.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}