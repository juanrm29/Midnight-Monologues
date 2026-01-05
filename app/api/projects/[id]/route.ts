import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let project;
    const numId = parseInt(id);
    
    if (!isNaN(numId)) {
      project = await prisma.project.findUnique({ where: { id: numId } });
    }
    
    if (!project) {
      project = await prisma.project.findUnique({ where: { slug: id } });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...project,
      tech: JSON.parse(project.tech || "[]"),
      links: project.links ? JSON.parse(project.links) : null,
      philosophy: project.philosophy ? JSON.parse(project.philosophy) : null,
      sections: project.sections ? JSON.parse(project.sections) : null,
      gallery: project.gallery ? JSON.parse(project.gallery) : [],
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// PUT update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        slug: body.slug,
        title: body.title,
        description: body.description,
        tech: JSON.stringify(body.tech || []),
        year: body.year,
        status: body.status || "Active",
        featured: body.featured || false,
        role: body.role || null,
        tagline: body.tagline || null,
        links: body.links ? JSON.stringify(body.links) : null,
        philosophy: body.philosophy ? JSON.stringify(body.philosophy) : null,
        sections: body.sections ? JSON.stringify(body.sections) : null,
        gallery: body.gallery ? JSON.stringify(body.gallery) : null,
      },
    });

    return NextResponse.json({
      ...project,
      tech: JSON.parse(project.tech),
      links: project.links ? JSON.parse(project.links) : null,
      philosophy: project.philosophy ? JSON.parse(project.philosophy) : null,
      sections: project.sections ? JSON.parse(project.sections) : null,
      gallery: project.gallery ? JSON.parse(project.gallery) : [],
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
