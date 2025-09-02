import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getCachedUser } from "@/lib/userCache";

// GET /api/items - Get all items for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCachedUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const items = await prisma.item.findMany({
      where: {
        userId: user.id,
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
        createdAt: "desc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/items - Create a new item
export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCachedUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, price, description, isForAllClients, clientIds } = body;

    // Validation
    if (!name || !price) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return NextResponse.json(
        { error: "Price must be a valid positive number" },
        { status: 400 }
      );
    }

    // If not for all clients, validate that clientIds are provided
    if (!isForAllClients && (!clientIds || clientIds.length === 0)) {
      return NextResponse.json(
        { error: "Client selection is required when not for all clients" },
        { status: 400 }
      );
    }

    // Create the item
    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        description: description?.trim() || null,
        isForAllClients: Boolean(isForAllClients),
        userId: user.id,
      },
    });

    // If not for all clients, create ItemClient associations
    if (!isForAllClients && clientIds && clientIds.length > 0) {
      // Verify that all clientIds belong to the user
      const userClients = await prisma.client.findMany({
        where: {
          id: { in: clientIds },
          userId: user.id,
        },
        select: { id: true },
      });

      if (userClients.length !== clientIds.length) {
        // Rollback the item creation
        await prisma.item.delete({ where: { id: item.id } });
        return NextResponse.json(
          { error: "One or more clients not found" },
          { status: 400 }
        );
      }

      await prisma.itemClient.createMany({
        data: clientIds.map((clientId) => ({
          itemId: item.id,
          clientId,
        })),
      });
    }

    // Fetch the created item with associations
    const createdItem = await prisma.item.findUnique({
      where: { id: item.id },
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
    });

    return NextResponse.json(createdItem, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
