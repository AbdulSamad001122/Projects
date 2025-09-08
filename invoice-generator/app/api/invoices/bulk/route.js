import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";
import { renumberClientInvoices, isAutoRenumberingEnabled } from "@/app/utils/invoiceRenumbering";

export async function DELETE(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Use cached user lookup to reduce database queries
    const user = await getCachedUser(userId);

    // Verify that the client belongs to the authenticated user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get all invoices for this client to count them
    const invoicesToDelete = await prisma.invoice.findMany({
      where: {
        clientId: clientId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (invoicesToDelete.length === 0) {
      return NextResponse.json(
        { message: "No invoices found for this client" },
        { status: 200 }
      );
    }

    // Delete all invoices for this client
    const deleteResult = await prisma.invoice.deleteMany({
      where: {
        clientId: clientId,
        userId: user.id,
      },
    });

    // Since all invoices are deleted, no need to renumber
    // Auto-renumbering only applies when some invoices remain

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} invoices`,
    });
  } catch (error) {
    console.error("Error deleting all invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}