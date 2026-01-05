import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { year: "desc" },
    });

    const parsed = projects.map((p) => ({
      ...p,
      tech: JSON.parse(p.tech || "[]"),
      links: p.links ? JSON.parse(p.links) : null,
      philosophy: p.philosophy ? JSON.parse(p.philosophy) : null,
      sections: p.sections ? JSON.parse(p.sections) : null,
      gallery: p.gallery ? JSON.parse(p.gallery) : [],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST create project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const project = await prisma.project.create({
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
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
