import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";

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

    // Use cached user lookup to reduce database queries
    const user = await getCachedUser(userId);

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
