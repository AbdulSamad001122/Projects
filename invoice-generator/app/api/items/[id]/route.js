import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getCachedUser } from "@/lib/userCache";
import { 
  validateName, 
  validatePrice, 
  sanitizeString,
  validateRequestSize 
} from "@/lib/validation";
import { applyRateLimit, createRateLimitResponse } from "@/lib/rateLimiter";

// GET /api/items/[id] - Get a specific item
export async function GET(request, { params }) {
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, 'read');
    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCachedUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        isForAllClients: true,
        createdAt: true,
        updatedAt: true,
        itemClients: {
          select: {
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

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/items/[id] - Update an item
export async function PUT(request, { params }) {
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, 'write');
    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request size
    const sizeValidation = await validateRequestSize(request, 10240); // 10KB limit
    if (!sizeValidation.isValid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 413 }
      );
    }

    const user = await getCachedUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, price, description, isForAllClients, clientIds } = body;

    // Check if item exists and belongs to user
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Validate and sanitize required fields
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    const priceValidation = validatePrice(price);
    if (!priceValidation.isValid) {
      return NextResponse.json(
        { error: priceValidation.error },
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

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name: nameValidation.value,
        price: priceValidation.value,
        description: description ? sanitizeString(description, 1000) : null,
        isForAllClients: Boolean(isForAllClients),
      },
    });

    // Update client associations
    // First, delete existing associations
    await prisma.itemClient.deleteMany({
      where: { itemId: id },
    });

    // If not for all clients, create new associations
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
        return NextResponse.json(
          { error: "One or more clients not found" },
          { status: 400 }
        );
      }

      await prisma.itemClient.createMany({
        data: clientIds.map((clientId) => ({
          itemId: id,
          clientId,
        })),
      });
    }

    // Fetch the updated item with associations
    const itemWithAssociations = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        isForAllClients: true,
        createdAt: true,
        updatedAt: true,
        itemClients: {
          select: {
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

    return NextResponse.json(itemWithAssociations);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id] - Delete an item
export async function DELETE(request, { params }) {
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, 'write');
    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCachedUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    // Check if item exists and belongs to user
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete the item (ItemClient associations will be deleted automatically due to cascade)
    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
