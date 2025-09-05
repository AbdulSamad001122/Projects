import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getCachedUser } from "@/lib/userCache";
import { 
  validatePagination, 
  validateCursorPagination,
  generateCursor,
  validateName, 
  validatePrice, 
  sanitizeString,
  validateRequestSize 
} from "@/lib/validation";
import { applyRateLimit, createRateLimitResponse } from "@/lib/rateLimiter";

// GET /api/items - Get items for the authenticated user with pagination support
export async function GET(request) {
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

    // Parse pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const useCursor = searchParams.get("cursor") !== null || searchParams.get("use_cursor") === "true";

    const user = await getCachedUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (useCursor) {
      // Use cursor-based pagination (more efficient for large datasets)
      const { cursor, limit } = validateCursorPagination(
        searchParams.get("cursor"),
        searchParams.get("limit"),
        100 // Max 100 items per page
      );

      // Build where clause with cursor
      const whereClause = {
        userId: user.id,
        ...(cursor && { id: { lt: cursor } }) // Use 'lt' for descending order
      };

      const items = await prisma.item.findMany({
        where: whereClause,
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
        orderBy: {
          id: "desc", // Use ID for consistent cursor ordering
        },
        take: limit + 1, // Fetch one extra to check if there are more
      });

      const hasMore = items.length > limit;
      if (hasMore) {
        items.pop(); // Remove the extra item
      }

      const nextCursor = hasMore && items.length > 0 ? generateCursor(items[items.length - 1].id) : null;

      return NextResponse.json({
        items,
        pagination: {
          limit,
          hasMore,
          nextCursor,
          cursors: {
            next: nextCursor
          }
        },
      });
    } else {
      // Fallback to offset-based pagination for backward compatibility
      const { page, limit, offset } = validatePagination(
        searchParams.get("page"),
        searchParams.get("limit"),
        100 // Max 100 items per page
      );

      // Get total count for pagination metadata
      const totalCount = await prisma.item.count({
        where: {
          userId: user.id,
        },
      });

      const items = await prisma.item.findMany({
        where: {
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
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      });

      const totalPages = Math.ceil(totalCount / limit);
      const hasMore = page < totalPages;

      return NextResponse.json({
        items,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasMore,
        },
      });
    }
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

    const body = await request.json();
    const { name, price, description, isForAllClients, clientIds } = body;

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

    // Validate clientIds if provided
    if (!isForAllClients && clientIds && clientIds.length > 0) {
      for (const clientId of clientIds) {
        if (!/^[a-zA-Z0-9_-]+$/.test(clientId)) {
          return NextResponse.json(
            { error: "Invalid client ID format" },
            { status: 400 }
          );
        }
      }
    }

    // Create the item
    const item = await prisma.item.create({
      data: {
        name: nameValidation.value,
        price: priceValidation.value,
        description: description ? sanitizeString(description, 1000) : null,
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

    return NextResponse.json(createdItem, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
