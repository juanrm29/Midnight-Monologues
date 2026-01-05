import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all sticky notes
export async function GET() {
  try {
    const notes = await prisma.stickyNote.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Transform to match frontend format
    const parsed = notes.map((n) => ({
      ...n,
      position: { x: n.positionX, y: n.positionY },
      createdAt: n.createdAt.toISOString().split("T")[0],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST create sticky note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const note = await prisma.stickyNote.create({
      data: {
        question: body.question,
        answer: body.answer,
        author: body.author,
        color: body.color || "gold",
        positionX: body.position?.x || 20,
        positionY: body.position?.y || 20,
        rotation: body.rotation || 0,
      },
    });

    return NextResponse.json({
      ...note,
      position: { x: note.positionX, y: note.positionY },
      createdAt: note.createdAt.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
