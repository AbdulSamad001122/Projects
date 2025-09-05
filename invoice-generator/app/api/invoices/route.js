import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";
import { renumberClientInvoices, isAutoRenumberingEnabled } from "@/app/utils/invoiceRenumbering";
import { 
  validatePagination, 
  validateCursorPagination,
  generateCursor,
  createSafeSearchConditions, 
  validateDate, 
  validateInvoiceStatus,
  sanitizeString 
} from "@/lib/validation";
import { applyRateLimit, createRateLimitResponse } from "@/lib/rateLimiter";
import { performanceMiddleware, trackDbQuery } from "@/lib/performanceMonitor";
import { securityMiddleware, securityAudit, SecurityEventTypes, RiskLevels } from "@/lib/securityAudit";
import { logErrorWithMonitoring, AppError, ErrorTypes } from "@/lib/errorHandler";

export async function GET(request) {
  // Start performance monitoring
  const perfTracker = performanceMiddleware(request);
  let user = null;
  
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, 'search');
    if (rateLimitResult.isLimited) {
      perfTracker.end(429, 0);
      return createRateLimitResponse(rateLimitResult);
    }

    // Security middleware check
    const securityCheck = securityMiddleware(request);
    if (securityCheck.hasIssues && securityCheck.riskLevel === RiskLevels.HIGH) {
      securityAudit.logSecurityEvent(
        SecurityEventTypes.SUSPICIOUS_REQUEST,
        RiskLevels.HIGH,
        { issues: securityCheck.issues },
        request
      );
      perfTracker.end(403, 0);
      return NextResponse.json(
        { error: 'Request blocked for security reasons' },
        { status: 403 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = sanitizeString(searchParams.get("clientId"));
    const useCursor = searchParams.get("cursor") !== null || searchParams.get("use_cursor") === "true";
    
    // Validate pagination parameters
    let page, limit, offset, cursor;
    if (useCursor) {
      const cursorPagination = validateCursorPagination(
        searchParams.get("cursor"),
        searchParams.get("limit"),
        20 // Max 20 invoices per page
      );
      cursor = cursorPagination.cursor;
      limit = cursorPagination.limit;
    } else {
      const offsetPagination = validatePagination(
        searchParams.get("page"),
        searchParams.get("limit"),
        20 // Max 20 invoices per page
      );
      page = offsetPagination.page;
      limit = offsetPagination.limit;
      offset = offsetPagination.offset;
    }
    
    // Validate and sanitize search parameters
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
    user = await getCachedUser(userId);

    // Validate client ID format
    if (!clientId || !/^[a-zA-Z0-9_-]+$/.test(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID format" },
        { status: 400 }
      );
    }

    // Build base where clause
    const whereClause = {
      clientId: clientId,
      userId: user.id,
      ...(useCursor && cursor && { id: { lt: cursor } }) // Add cursor condition for cursor-based pagination
    };

    // Build search conditions array
    const searchConditions = [];

    // Add safe search term condition
    if (searchTerm) {
      const searchCondition = createSafeSearchConditions(searchTerm, ['invoiceNumber']);
      if (searchCondition) {
        searchConditions.push(searchCondition);
      }
    }

    // Add validated date search condition
    if (searchDate) {
      const dateValidation = validateDate(searchDate);
      if (dateValidation.isValid) {
        const dateConditions = [
          {
            data: {
              path: ["invoiceDate"],
              string_contains: dateValidation.value
            }
          },
          {
            data: {
              path: ["issueDate"],
              string_contains: dateValidation.value
            }
          }
        ];
        searchConditions.push({ OR: dateConditions });
      }
    }

    // Add validated status search condition
    // Temporarily disabled JSON filtering due to Prisma compatibility issues
    // TODO: Implement client-side filtering or use raw SQL
    if (searchStatus) {
      console.log('Status filtering requested:', searchStatus);
      // Will be handled after fetching all invoices
    }

    // Combine search conditions with AND logic
    if (searchConditions.length > 0) {
      whereClause.AND = searchConditions;
    }

    let invoices, totalCount;
    
    if (useCursor) {
      // Cursor-based pagination - no need for count query
      const findQuery = trackDbQuery('FIND_MANY', 'invoice');
      invoices = await prisma.invoice.findMany({
        where: whereClause,
        select: {
          id: true,
          data: true, // Contains invoice details including status
          createdAt: true,
          updatedAt: true,
          userId: true, // Needed for security checks
        },
        orderBy: {
          id: "desc", // Use ID for consistent cursor ordering
        },
        take: limit + 1, // Fetch one extra to check if there are more
      });
      findQuery.end(invoices.length);
      totalCount = null; // Not needed for cursor pagination
    } else {
      // Offset-based pagination (legacy)
      const countQuery = trackDbQuery('COUNT', 'invoice');
      totalCount = await prisma.invoice.count({
        where: whereClause,
      });
      countQuery.end();

      const findQuery = trackDbQuery('FIND_MANY', 'invoice');
      invoices = await prisma.invoice.findMany({
        where: whereClause,
        select: {
          id: true,
          data: true, // Contains invoice details including status
          createdAt: true,
          updatedAt: true,
          userId: true, // Needed for security checks
        },
        orderBy: {
          createdAt: "desc",
        },
        // When status filtering is applied, fetch all records to ensure proper filtering
        skip: searchStatus ? 0 : offset,
        take: searchStatus ? undefined : limit, // Fetch all when filtering by status
      });
      findQuery.end(invoices.length);
    }

    // Apply client-side status filtering
    if (searchStatus) {
      const statusValidation = validateInvoiceStatus(searchStatus);
      if (statusValidation.isValid) {
        invoices = invoices.filter(invoice => {
          return invoice.data && invoice.data.status === statusValidation.value;
        });
      }
    }

    if (useCursor) {
      // Handle cursor-based pagination response
      const hasMore = invoices.length > limit;
      if (hasMore) {
        invoices.pop(); // Remove the extra item
      }

      // Apply status filtering if needed
      if (searchStatus) {
        const statusValidation = validateInvoiceStatus(searchStatus);
        if (statusValidation.isValid) {
          invoices = invoices.filter(invoice => {
            return invoice.data && invoice.data.status === statusValidation.value;
          });
        }
      }

      const nextCursor = hasMore && invoices.length > 0 ? generateCursor(invoices[invoices.length - 1].id) : null;

      const response = NextResponse.json({ 
        invoices,
        pagination: {
          limit,
          hasMore,
          nextCursor,
          cursors: {
            next: nextCursor
          }
        },
      });
      
      perfTracker.end(200, JSON.stringify(response).length);
      return response;
    } else {
      // Handle offset-based pagination response (legacy)
      // Apply pagination after filtering (only when status filtering is applied)
      const filteredTotal = invoices.length;
      if (searchStatus) {
        const statusValidation = validateInvoiceStatus(searchStatus);
        if (statusValidation.isValid) {
          invoices = invoices.filter(invoice => {
            return invoice.data && invoice.data.status === statusValidation.value;
          });
        }
        // Apply pagination after filtering when status filtering is used
        invoices = invoices.slice(offset, offset + limit);
      }
      // When no status filtering, pagination is already applied in the query

      // Use appropriate total count based on whether filtering was applied
      const finalTotalCount = searchStatus ? filteredTotal : totalCount;
      const totalPages = Math.ceil(finalTotalCount / limit);
      const hasMore = page < totalPages;

      const response = NextResponse.json({ 
        invoices,
        pagination: {
          page,
          limit,
          totalCount: finalTotalCount,
          totalPages,
          hasMore,
        },
      });
      
      perfTracker.end(200, JSON.stringify(response).length);
       return response;
     }
  } catch (error) {
    logErrorWithMonitoring(error, {
      context: 'GET /api/invoices',
      userId: user?.id || 'unknown',
      searchParams: Object.fromEntries(new URL(request.url).searchParams)
    });
    
    perfTracker.end(500, 0);
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

      return NextResponse.json({ invoice });
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
      // Use raw SQL for atomic JSON update to avoid N+1 query
       const updatedInvoice = await prisma.$executeRaw`
         UPDATE invoices 
         SET data = jsonb_set(data, '{status}', ${JSON.stringify(status)}::jsonb, true),
             updated_at = NOW()
         WHERE id = ${invoiceId} AND user_id = ${user.id}
       `;
      
      if (updatedInvoice === 0) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      
      // Fetch the updated invoice
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId, userId: user.id },
        select: {
          id: true,
          data: true,
          createdAt: true,
          updatedAt: true
        }
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
