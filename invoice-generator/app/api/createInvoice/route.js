import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, createClerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoicePayload = await request.json();
    const { clientId, ...invoiceData } = invoicePayload;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    console.log("Client ID:", clientId);
    console.log("Invoice data:", invoiceData);

    // Ensure user exists in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          name: "User", // Default name, can be updated later
        },
      });
    }

    // Create new invoice in database
    const newInvoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: clientId,
        data: invoiceData,
      },
    });

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error) {
    console.error("Error in createInvoice:", error);
    return NextResponse.json(
      { error: "Error in creating new Invoice" },
      { status: 500 }
    );
  }
}
