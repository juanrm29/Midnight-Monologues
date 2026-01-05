import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try to find by ID first, then by slug
    let article;
    const numId = parseInt(id);
    
    if (!isNaN(numId)) {
      article = await prisma.article.findUnique({ where: { id: numId } });
    }
    
    if (!article) {
      article = await prisma.article.findUnique({ where: { slug: id } });
    }

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Try to parse content - if it's a JSON array (legacy), parse it
    // If it's a plain string (markdown), keep it as-is
    let content;
    try {
      const parsed = JSON.parse(article.content || "\"\"");
      // If it's an array, it's legacy ContentBlocks format
      // If it's a string, it's markdown
      content = parsed;
    } catch {
      // If JSON parse fails, treat as raw markdown string
      content = article.content || "";
    }

    return NextResponse.json({
      ...article,
      tags: JSON.parse(article.tags || "[]"),
      epigraph: article.epigraph ? JSON.parse(article.epigraph) : null,
      content,
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}

// PUT update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const article = await prisma.article.update({
      where: { id: parseInt(id) },
      data: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt,
        date: body.date,
        readTime: body.readTime,
        tags: JSON.stringify(body.tags || []),
        featured: body.featured || false,
        epigraph: body.epigraph ? JSON.stringify(body.epigraph) : null,
        // Store content as JSON - works for both string (markdown) and array (legacy)
        content: JSON.stringify(body.content ?? ""),
      },
    });

    // Parse content for response
    let responseContent;
    try {
      responseContent = JSON.parse(article.content);
    } catch {
      responseContent = article.content;
    }

    return NextResponse.json({
      ...article,
      tags: JSON.parse(article.tags),
      epigraph: article.epigraph ? JSON.parse(article.epigraph) : null,
      content: responseContent,
    });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

// DELETE article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.article.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
