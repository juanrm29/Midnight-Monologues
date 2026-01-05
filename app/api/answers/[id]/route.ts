import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════════
// SINGLE ANSWER API - Approve/Reject/Delete answers
// ═══════════════════════════════════════════════════════════════════

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const answer = await prisma.stickyNote.findUnique({
      where: { id: parseInt(id) },
      include: {
        contemplation: {
          select: { question: true },
        },
      },
    });
    
    if (!answer) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(answer);
  } catch (error) {
    console.error("Failed to fetch answer:", error);
    return NextResponse.json(
      { error: "Failed to fetch answer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const answer = await prisma.stickyNote.update({
      where: { id: parseInt(id) },
      data: {
        approved: data.approved,
        // Allow editing other fields if needed
        ...(data.answer && { answer: data.answer }),
        ...(data.author && { author: data.author }),
        ...(data.color && { color: data.color }),
      },
    });
    
    return NextResponse.json(answer);
  } catch (error) {
    console.error("Failed to update answer:", error);
    return NextResponse.json(
      { error: "Failed to update answer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.stickyNote.delete({
      where: { id: parseInt(id) },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete answer:", error);
    return NextResponse.json(
      { error: "Failed to delete answer" },
      { status: 500 }
    );
  }
}
