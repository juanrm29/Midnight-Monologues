import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET single note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await prisma.stickyNote.findUnique({ where: { id: parseInt(id) } });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...note,
      position: { x: note.positionX, y: note.positionY },
      createdAt: note.createdAt.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

// PUT update note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const note = await prisma.stickyNote.update({
      where: { id: parseInt(id) },
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
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.stickyNote.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
