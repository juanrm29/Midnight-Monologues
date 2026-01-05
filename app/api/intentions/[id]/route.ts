import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET single intention
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const intention = await prisma.dailyIntention.findUnique({
      where: { id: parseInt(id) },
    });

    if (!intention) {
      return NextResponse.json({ error: "Intention not found" }, { status: 404 });
    }

    return NextResponse.json(intention);
  } catch (error) {
    console.error("Error fetching intention:", error);
    return NextResponse.json({ error: "Failed to fetch intention" }, { status: 500 });
  }
}

// PUT update intention
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const intention = await prisma.dailyIntention.update({
      where: { id: parseInt(id) },
      data: {
        text: body.text,
        active: body.active,
        order: body.order,
      },
    });

    return NextResponse.json(intention);
  } catch (error) {
    console.error("Error updating intention:", error);
    return NextResponse.json({ error: "Failed to update intention" }, { status: 500 });
  }
}

// DELETE intention
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.dailyIntention.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting intention:", error);
    return NextResponse.json({ error: "Failed to delete intention" }, { status: 500 });
  }
}
