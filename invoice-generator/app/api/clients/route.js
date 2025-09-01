import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";

// GET /api/clients - Fetch all clients for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    // Fetch clients for this user
    const clients = await prisma.client.findMany({
      where: {
        userId: dbUser.id,
      },
    });

    return NextResponse.json(clients);
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    // add client into Db
    const newClient = await prisma.client.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        userId: dbUser.id, // Use the database user's id
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    const body = await request.json();
    const { id, name, email } = body;

    // Validate required fields
    if (!id || !name || name.trim() === "") {
      return NextResponse.json(
        { error: "Client ID and name are required" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Update client in database
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
      },
    });

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
          userId: dbUser.id // Ensure user owns the client
        },
      });

      return NextResponse.json(
        { message: "Client deleted successfully" },
        { status: 200 }
      );
    } catch (deleteError) {
      if (deleteError.code === 'P2025') {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
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
