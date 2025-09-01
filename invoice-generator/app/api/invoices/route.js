import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";

export async function GET(request) {
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

    // Fetch all invoices for the specific client
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId: clientId,
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ invoices });
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

    // Delete the invoice (only if it belongs to the authenticated user)
    await prisma.invoice.delete({
      where: {
        id: invoiceId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
