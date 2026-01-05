import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all daily intentions
export async function GET() {
  try {
    const intentions = await prisma.dailyIntention.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(intentions);
  } catch (error) {
    console.error("Error fetching intentions:", error);
    return NextResponse.json({ error: "Failed to fetch intentions" }, { status: 500 });
  }
}

// POST create intention
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get max order
    const maxOrder = await prisma.dailyIntention.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const intention = await prisma.dailyIntention.create({
      data: {
        text: body.text,
        active: body.active ?? true,
        order: (maxOrder?.order ?? 0) + 1,
      },
    });

    return NextResponse.json(intention);
  } catch (error) {
    console.error("Error creating intention:", error);
    return NextResponse.json({ error: "Failed to create intention" }, { status: 500 });
  }
}
