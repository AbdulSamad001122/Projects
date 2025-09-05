import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";
import { renumberClientInvoices, isAutoRenumberingEnabled } from "@/app/utils/invoiceRenumbering";

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10; // Default to 10 for invoices
    const offset = (page - 1) * limit;
    
    // Search parameters
    const searchTerm = searchParams.get("search");
    const searchDate = searchParams.get("date");
    const searchStatus = searchParams.get("status");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Use cached user lookup to reduce database queries
    const user = await getCachedUser(userId);

    // Build where clause with search filters
    const whereClause = {
      clientId: clientId,
      userId: user.id,
    };

    // Add search filters to where clause
    if (searchTerm) {
      whereClause.data = {
        path: ["invoiceNumber"],
        string_contains: searchTerm
      };
    }

    if (searchDate) {
      // For date search, we need to check both invoiceDate and issueDate fields
      const dateConditions = [];
      
      dateConditions.push({
        data: {
          path: ["invoiceDate"],
          equals: searchDate
        }
      });
      
      dateConditions.push({
        data: {
          path: ["issueDate"],
          equals: searchDate
        }
      });
      
      if (whereClause.OR) {
        whereClause.AND = [{ OR: whereClause.OR }, { OR: dateConditions }];
        delete whereClause.OR;
      } else {
        whereClause.OR = dateConditions;
      }
    }

    if (searchStatus) {
      const statusCondition = {
        data: {
          path: ["status"],
          equals: searchStatus
        }
      };
      
      if (whereClause.data && whereClause.data.path) {
        // If we already have a data condition, combine them with AND
        whereClause.AND = [
          { data: whereClause.data },
          statusCondition
        ];
        delete whereClause.data;
      } else {
        whereClause.data = {
          path: ["status"],
          equals: searchStatus
        };
      }
    }

    // Get total count for pagination metadata
    const totalCount = await prisma.invoice.count({
      where: whereClause,
    });

    // Fetch invoices for the specific client with pagination and search
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({ 
      invoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const invoiceData = await request.json();

    // Use cached user lookup to reduce database queries
    const user = await getCachedUser(userId);

    // Update the invoice (only if it belongs to the authenticated user)
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: invoiceId,
        userId: user.id,
      },
      data: {
        data: invoiceData,
      },
    });

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Use cached user lookup to reduce database queries
    const user = await getCachedUser(userId);

    // Use Prisma's atomic update with JSON operations to avoid extra query
    try {
      const updatedInvoice = await prisma.invoice.update({
        where: {
          id: invoiceId,
          userId: user.id,
        },
        data: {
          data: {
            // Use Prisma's JSON update syntax to merge status into existing data
            ...(await prisma.invoice.findUnique({
              where: { id: invoiceId, userId: user.id },
              select: { data: true }
            }))?.data,
            status: status
          },
        },
      });

      return NextResponse.json({ invoice: updatedInvoice });
    } catch (updateError) {
      if (updateError.code === 'P2025') {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      throw updateError;
    }
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // Use cached user lookup to reduce database queries
    const user = await getCachedUser(userId);

    // First, get the invoice to find its clientId before deletion
    const invoiceToDelete = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: user.id,
      },
      select: {
        clientId: true,
      },
    });

    if (!invoiceToDelete) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const { clientId } = invoiceToDelete;

    // Delete the invoice (only if it belongs to the authenticated user)
    await prisma.invoice.delete({
      where: {
        id: invoiceId,
        userId: user.id,
      },
    });

    // Check if auto-renumbering is enabled for this client
    const autoRenumberEnabled = await isAutoRenumberingEnabled(clientId, user.id);
    
    if (autoRenumberEnabled) {
      // Re-number remaining invoices for this client
      await renumberClientInvoices(clientId, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
