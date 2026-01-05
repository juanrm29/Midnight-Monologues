import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════════
// SINGLE CONTEMPLATION API
// "Know thyself." - Delphi Oracle
// ═══════════════════════════════════════════════════════════════════

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contemplation = await prisma.contemplation.findUnique({
      where: { id: parseInt(id) },
      include: {
        answers: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    
    if (!contemplation) {
      return NextResponse.json(
        { error: "Contemplation not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(contemplation);
  } catch (error) {
    console.error("Failed to fetch contemplation:", error);
    return NextResponse.json(
      { error: "Failed to fetch contemplation" },
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
    
    const contemplation = await prisma.contemplation.update({
      where: { id: parseInt(id) },
      data: {
        question: data.question,
        active: data.active,
        featured: data.featured,
        order: data.order,
      },
    });
    
    return NextResponse.json(contemplation);
  } catch (error) {
    console.error("Failed to update contemplation:", error);
    return NextResponse.json(
      { error: "Failed to update contemplation" },
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
    
    // First, unlink any answers from this contemplation
    await prisma.stickyNote.updateMany({
      where: { contemplationId: parseInt(id) },
      data: { contemplationId: null },
    });
    
    await prisma.contemplation.delete({
      where: { id: parseInt(id) },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete contemplation:", error);
    return NextResponse.json(
      { error: "Failed to delete contemplation" },
      { status: 500 }
    );
  }
}
