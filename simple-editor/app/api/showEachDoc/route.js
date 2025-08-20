import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { documentId } = await request.json();

    console.log("document id for show each doc" + documentId);

    const doc = await prisma.doc.findUnique({
      where: { id: documentId },
      select: { content: true },
      
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Not any doc fount with that id" },
        { status: 500 }
      );
    }

    // const docsContent = JSON.stringify(doc.content, null, 2);
    // console.log("DOCS CONTENT : ", docsContent);

    return NextResponse.json({
      message: "doc successfully found with that id",
      docsContent: doc.content, // <-- real JSON object, not string
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while fetching docs content" },
      { status: 500 }
    );
  }
}
