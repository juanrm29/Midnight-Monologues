import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET profile (there's only one)
export async function GET() {
  try {
    let profile = await prisma.profile.findFirst();

    // Create default profile if none exists
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          name: "Juan Rizky Maulana",
          title: "Developer & Stoic Practitioner",
          bio: "Building thoughtful software guided by ancient wisdom.",
          location: "Indonesia",
          email: "hello@juanrizky.dev",
          social: JSON.stringify({
            github: "https://github.com/juanrizky",
            twitter: "https://twitter.com/juanrizky",
            linkedin: "https://linkedin.com/in/juanrizky",
          }),
        },
      });
    }

    return NextResponse.json({
      ...profile,
      social: profile.social ? JSON.parse(profile.social) : null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PUT update profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Get existing profile or create one
    let profile = await prisma.profile.findFirst();

    if (profile) {
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: {
          name: body.name,
          title: body.title,
          bio: body.bio,
          avatar: body.avatar || null,
          location: body.location || null,
          email: body.email || null,
          social: body.social ? JSON.stringify(body.social) : null,
        },
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          name: body.name,
          title: body.title,
          bio: body.bio,
          avatar: body.avatar || null,
          location: body.location || null,
          email: body.email || null,
          social: body.social ? JSON.stringify(body.social) : null,
        },
      });
    }

    return NextResponse.json({
      ...profile,
      social: profile.social ? JSON.parse(profile.social) : null,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
