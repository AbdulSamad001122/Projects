import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import { generateNextInvoiceNumber, isAutoRenumberingEnabled } from "@/app/utils/invoiceRenumbering";

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Use cached user lookup to reduce database queries
    const user = await getCachedUser(userId);

    // Check if auto-renumbering is enabled for this client
    const autoRenumberEnabled = await isAutoRenumberingEnabled(clientId, user.id);
    
    // Generate the next invoice number
    const invoiceNumber = await generateNextInvoiceNumber(clientId, user.id, autoRenumberEnabled);

    return NextResponse.json({ invoiceNumber });
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}