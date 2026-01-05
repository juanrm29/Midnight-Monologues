import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all articles
export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { date: "desc" },
    });

    // Parse JSON fields
    const parsed = articles.map((a) => ({
      ...a,
      tags: JSON.parse(a.tags || "[]"),
      epigraph: a.epigraph ? JSON.parse(a.epigraph) : null,
      content: JSON.parse(a.content || "[]"),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

// POST create article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const article = await prisma.article.create({
      data: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt,
        date: body.date,
        readTime: body.readTime,
        tags: JSON.stringify(body.tags || []),
        featured: body.featured || false,
        epigraph: body.epigraph ? JSON.stringify(body.epigraph) : null,
        content: JSON.stringify(body.content || []),
      },
    });

    return NextResponse.json({
      ...article,
      tags: JSON.parse(article.tags),
      epigraph: article.epigraph ? JSON.parse(article.epigraph) : null,
      content: JSON.parse(article.content),
    });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
