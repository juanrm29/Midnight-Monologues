import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════════
// PUBLIC ANSWERS API - Users submit answers to contemplations
// These become sticky notes on the Board of Collective (after approval)
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.answer || !data.author) {
      return NextResponse.json(
        { error: "Answer and author are required" },
        { status: 400 }
      );
    }

    // Get the contemplation question if contemplationId is provided
    let question = data.question || "A personal reflection";
    
    if (data.contemplationId) {
      const contemplation = await prisma.contemplation.findUnique({
        where: { id: data.contemplationId },
      });
      if (contemplation) {
        question = contemplation.question;
      }
    }

    // Random position and rotation for the sticky note
    const positionX = Math.floor(Math.random() * 60) + 10; // 10-70%
    const positionY = Math.floor(Math.random() * 50) + 10; // 10-60%
    const rotation = Math.floor(Math.random() * 10) - 5; // -5 to 5 degrees
    
    // Random color from Stoic palette
    const colors = ["gold", "sage", "stone", "amber", "bronze"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const stickyNote = await prisma.stickyNote.create({
      data: {
        question,
        answer: data.answer,
        author: data.author,
        color,
        positionX,
        positionY,
        rotation,
        approved: false, // Requires approval before showing on board
        contemplationId: data.contemplationId || null,
      },
    });

    return NextResponse.json({ 
      ...stickyNote, 
      message: "Your reflection has been submitted and is pending approval." 
    });
  } catch (error) {
    console.error("Failed to create answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showPending = searchParams.get("pending") === "true";
    const showAll = searchParams.get("all") === "true";
    
    // For admin: show pending or all
    // For public: only show approved
    const whereClause = showAll 
      ? {} 
      : showPending 
        ? { approved: false }
        : { approved: true };
    
    const answers = await prisma.stickyNote.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        contemplation: {
          select: { question: true },
        },
      },
    });
    
    return NextResponse.json(answers);
  } catch (error) {
    console.error("Failed to fetch answers:", error);
    return NextResponse.json(
      { error: "Failed to fetch answers" },
      { status: 500 }
    );
  }
}
