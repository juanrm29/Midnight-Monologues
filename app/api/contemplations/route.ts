import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════════
// CONTEMPLATIONS API - Stoic Questions for Reflection
// "The unexamined life is not worth living." - Socrates
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const contemplations = await prisma.contemplation.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: {
        answers: {
          orderBy: { createdAt: "desc" },
          take: 5, // Last 5 answers per contemplation
        },
      },
    });
    return NextResponse.json(contemplations);
  } catch (error) {
    console.error("Failed to fetch contemplations:", error);
    return NextResponse.json(
      { error: "Failed to fetch contemplations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Get max order for new contemplation
    const maxOrder = await prisma.contemplation.aggregate({
      _max: { order: true },
    });
    
    const contemplation = await prisma.contemplation.create({
      data: {
        question: data.question,
        active: data.active ?? true,
        featured: data.featured ?? false,
        order: data.order ?? (maxOrder._max.order ?? -1) + 1,
      },
    });
    
    return NextResponse.json(contemplation);
  } catch (error) {
    console.error("Failed to create contemplation:", error);
    return NextResponse.json(
      { error: "Failed to create contemplation" },
      { status: 500 }
    );
  }
}

// Bulk update order
export async function PUT(request: Request) {
  try {
    const { contemplations } = await request.json();
    
    // Update each contemplation's order in a transaction
    await prisma.$transaction(
      contemplations.map((c: { id: number; order: number }) =>
        prisma.contemplation.update({
          where: { id: c.id },
          data: { order: c.order },
        })
      )
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update contemplation order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
