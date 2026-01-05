import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all quotes
export async function GET() {
  try {
    const quotes = await prisma.quote.findMany();
    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}

// POST create quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const quote = await prisma.quote.create({
      data: {
        text: body.text,
        author: body.author,
        source: body.source,
        category: body.category || null,
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
