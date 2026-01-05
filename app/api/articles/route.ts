import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to parse content (handles both legacy array and new string format)
function parseContent(contentStr: string | null): string | unknown[] {
  if (!contentStr) return "";
  try {
    const parsed = JSON.parse(contentStr);
    return parsed;
  } catch {
    return contentStr;
  }
}

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
      content: parseContent(a.content),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

// POST create article (with upsert to handle duplicate slugs)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use upsert to handle cases where slug already exists
    const article = await prisma.article.upsert({
      where: { slug: body.slug },
      update: {
        title: body.title,
        excerpt: body.excerpt,
        date: body.date,
        readTime: body.readTime,
        tags: JSON.stringify(body.tags || []),
        featured: body.featured || false,
        epigraph: body.epigraph ? JSON.stringify(body.epigraph) : null,
        content: JSON.stringify(body.content ?? ""),
      },
      create: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt,
        date: body.date,
        readTime: body.readTime,
        tags: JSON.stringify(body.tags || []),
        featured: body.featured || false,
        epigraph: body.epigraph ? JSON.stringify(body.epigraph) : null,
        content: JSON.stringify(body.content ?? ""),
      },
    });

    return NextResponse.json({
      ...article,
      tags: JSON.parse(article.tags),
      epigraph: article.epigraph ? JSON.parse(article.epigraph) : null,
      content: parseContent(article.content),
    });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
