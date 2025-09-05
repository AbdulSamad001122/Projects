import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";
import { 
  validatePagination, 
  validateCursorPagination,
  generateCursor,
  validateEmail, 
  validateName, 
  sanitizeString,
  validateRequestSize 
} from "@/lib/validation";
import { applyRateLimit, createRateLimitResponse } from "@/lib/rateLimiter";

// GET /api/clients - Fetch clients for the authenticated user with pagination support
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
    
    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    if (useCursor) {
      // Use cursor-based pagination (more efficient for large datasets)
      const { cursor, limit } = validateCursorPagination(
        searchParams.get("cursor"),
        searchParams.get("limit"),
        50 // Max 50 clients per page
      );

      // Build where clause with cursor
      const whereClause = {
        userId: dbUser.id,
        ...(cursor && { id: { lt: cursor } }) // Use 'lt' for descending order
      };

      // Fetch clients with cursor pagination
      const clients = await prisma.client.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          autoRenumberInvoices: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          id: "desc", // Use ID for consistent ordering
        },
        take: limit + 1, // Fetch one extra to check if there are more
      });

      const hasMore = clients.length > limit;
      if (hasMore) {
        clients.pop(); // Remove the extra item
      }

      const nextCursor = hasMore && clients.length > 0 ? generateCursor(clients[clients.length - 1].id) : null;

      return NextResponse.json({
        clients,
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
        50 // Max 50 clients per page
      );

      // Get total count for pagination metadata
      const totalCount = await prisma.client.count({
        where: {
          userId: dbUser.id,
        },
      });

      // Fetch clients for this user with pagination
      const clients = await prisma.client.findMany({
        where: {
          userId: dbUser.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          autoRenumberInvoices: true,
          createdAt: true,
          updatedAt: true,
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
        clients,
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
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
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

    const body = await request.json();
    const { name, email } = body;

    // Validate and sanitize required fields
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    // add client into Db
    const newClient = await prisma.client.create({
      data: {
        name: nameValidation.value,
        email: emailValidation.value,
        userId: dbUser.id, // Use the database user's id
        autoRenumberInvoices: true, // Default to auto-renumbering enabled
      },
    });

    console.log("new client added successfully");

    return NextResponse.json(newClient, {
      message: "Client added successfully",
      status: 201,
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update an existing client
export async function PUT(request) {
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

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    const body = await request.json();
    const { id, name, email, updateOption } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Validate and sanitize fields
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Update client in database
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: nameValidation.value,
        email: emailValidation.value,
      },
    });

    // If updateOption is 'allInvoices', update all invoices with new client data
    if (updateOption === "allInvoices") {
      // Get all invoices for this client
      const invoices = await prisma.invoice.findMany({
        where: {
          clientId: id,
          userId: dbUser.id,
        },
        select: {
          id: true,
          data: true, // Only need id and data for updating
        },
      });

      // Update each invoice's data with new client information
      for (const invoice of invoices) {
        const invoiceData = invoice.data;

        // Update client information in invoice data
        if (invoiceData && typeof invoiceData === "object") {
          const updatedInvoiceData = {
            ...invoiceData,
            clientName: nameValidation.value,
            clientEmail: emailValidation.value,
          };

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { data: updatedInvoiceData },
          });
        }
      }
    }

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(request) {
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

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    // Delete client from database with ownership verification
    try {
      await prisma.client.delete({
        where: {
          id,
          userId: dbUser.id, // Ensure user owns the client
        },
      });

      return NextResponse.json(
        { message: "Client deleted successfully" },
        { status: 200 }
      );
    } catch (deleteError) {
      if (deleteError.code === "P2025") {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }
      throw deleteError;
    }
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
