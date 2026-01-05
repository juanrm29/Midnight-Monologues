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

    return NextResponse.json({
      ...article,
      tags: JSON.parse(article.tags || "[]"),
      epigraph: article.epigraph ? JSON.parse(article.epigraph) : null,
      content: JSON.parse(article.content || "[]"),
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
