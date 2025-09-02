import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getCachedUser } from "@/lib/userCache";

// GET /api/items/client/[clientId] - Get items available for a specific client
export async function GET(request, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCachedUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { clientId } = await params;

    // Verify that the client belongs to the user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get items that are either:
    // 1. For all clients (isForAllClients = true)
    // 2. Specifically assigned to this client
    const items = await prisma.item.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            isForAllClients: true,
          },
          {
            itemClients: {
              some: {
                clientId: clientId,
              },
            },
          },
        ],
      },
      include: {
        itemClients: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items for client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
