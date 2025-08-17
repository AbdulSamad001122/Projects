import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // your prisma client import
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    const { documentId, json, html } = await request.json();
    console.log(documentId);

    if (documentId) {
      console.log("documentId is found");
    }

    if (!documentId) {
      return NextResponse.json(
        { error: " Not able to parse the document id" },
        { status: 500 }
      );
    }

    const getDoc = await prisma.doc.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!getDoc) {
      return NextResponse.json({ error: "Not any doc found" }, { status: 401 });
    }

    console.log(getDoc);

    const updatedDoc = await prisma.doc.update({
      where: {
        id: documentId, // same document ID you already have
      },
      data: {
        content: json,
      },
    });

    return NextResponse.json(
      { message: "Document saved successfully", updatedDoc },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while creating a doc" },
      { status: 500 }
    );
  }
}
