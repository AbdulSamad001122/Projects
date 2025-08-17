import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    const clerkuser = await currentUser();
    if (!clerkuser) {
      return NextResponse.json({ error: "Unauthorized User" }, { status: 401 });
    }

    const clerkId = clerkuser.id;
    const { title } = await request.json();

    // Find or create user by clerkId
    const user = await prisma.user.upsert({
      where: { clerkId }, // ✅ match by Clerk's ID
      update: {},
      create: { clerkId },
    });

    // Create document linked to Prisma's user.id
    const newDoc = await prisma.doc.create({
      data: {
        title,
        content: {}, // ✅ this is fine — it will store empty JSON
        userId: user.id,
      },
    });

    return NextResponse.json({ data: newDoc }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while creating a doc" },
      { status: 500 }
    );
  }
}
