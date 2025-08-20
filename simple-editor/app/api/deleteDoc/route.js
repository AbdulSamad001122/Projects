import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function DELETE(request) {
  try {
    const clerkuser = await currentUser();
    if (!clerkuser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    await prisma.doc.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
