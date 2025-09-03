import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const clientId = resolvedParams.id;
    
    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    // Find the specific client that belongs to the authenticated user
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        userId: dbUser.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const clientId = resolvedParams.id;
    
    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { autoRenumberInvoices } = body;

    // Validate the input
    if (typeof autoRenumberInvoices !== 'boolean') {
      return NextResponse.json(
        { error: 'autoRenumberInvoices must be a boolean' },
        { status: 400 }
      );
    }

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    // Verify the client belongs to the authenticated user
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: dbUser.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Update the client's auto-renumbering setting
    const updatedClient = await prisma.client.update({
      where: {
        id: clientId,
      },
      data: {
        autoRenumberInvoices,
      },
    });

    return NextResponse.json({
      message: 'Client setting updated successfully',
      client: updatedClient,
    });
  } catch (error) {
    console.error('Error updating client setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}