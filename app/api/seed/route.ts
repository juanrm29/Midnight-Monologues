import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════════
// SEED DATABASE - Populate with initial Stoic content
// "Well begun is half done." - Aristotle
// ═══════════════════════════════════════════════════════════════════

export async function POST() {
  try {
    // Clear existing data
    await prisma.stickyNote.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.project.deleteMany();
    await prisma.article.deleteMany();
    await prisma.profile.deleteMany();

    // Seed Profile
    await prisma.profile.create({
      data: {
        name: "Juan Rizky Maulana",
        title: "Developer & Stoic Practitioner",
        bio: "Building thoughtful software guided by ancient wisdom. Exploring the intersection of technology and philosophy.",
        location: "Indonesia",
        email: "hello@juanrizky.dev",
        social: JSON.stringify({
          github: "https://github.com/juanrizky",
          twitter: "https://twitter.com/juanrizky",
          linkedin: "https://linkedin.com/in/juanrizky",
        }),
      },
    });

    // Seed Articles
    await prisma.article.createMany({
      data: [
        {
          slug: "dichotomy-of-control",
          title: "The Dichotomy of Control",
          excerpt: "On distinguishing what is within our power and what is not—and why this matters for peace of mind.",
          date: "2025-12-15",
          readTime: "8 min",
          tags: JSON.stringify(["stoicism", "philosophy"]),
          featured: true,
          epigraph: JSON.stringify({
            text: "Make the best use of what is in your power, and take the rest as it happens.",
            author: "Epictetus",
            source: "Enchiridion",
          }),
          content: JSON.stringify([
            { type: "paragraph", text: "The dichotomy of control is perhaps the most fundamental teaching of Stoic philosophy. It forms the bedrock upon which all other Stoic practices are built, and understanding it deeply can transform how we navigate life's challenges." },
            { type: "heading", text: "What Is Within Our Power" },
            { type: "paragraph", text: "According to Epictetus, only our own judgments, impulses, desires, and aversions are truly within our power. Everything else—our bodies, reputations, possessions, and the actions of others—lies outside our direct control." },
            { type: "quote", text: "Some things are within our power, while others are not. Within our power are opinion, motivation, desire, aversion, and, in a word, whatever is of our own doing; not within our power are our body, our property, reputation, office, and, in a word, whatever is not of our own doing.", author: "Epictetus" },
            { type: "heading", text: "The Liberation of Acceptance" },
            { type: "paragraph", text: "When we truly internalize this distinction, a profound liberation follows. We stop exhausting ourselves trying to control the uncontrollable and instead focus our energy where it can actually make a difference." },
          ]),
        },
        {
          slug: "memento-mori",
          title: "Memento Mori: Remember You Must Die",
          excerpt: "How contemplating mortality clarifies what truly matters and liberates us from trivial concerns.",
          date: "2025-11-28",
          readTime: "6 min",
          tags: JSON.stringify(["stoicism", "death"]),
          featured: false,
          content: JSON.stringify([
            { type: "paragraph", text: "In ancient Rome, when a general celebrated a triumph through the streets of the city, a slave would stand behind him whispering: 'Memento mori'—remember you must die." },
            { type: "paragraph", text: "This practice was not meant to be morbid, but liberating. By keeping death in mind, we are reminded of what truly matters." },
          ]),
        },
        {
          slug: "amor-fati",
          title: "Amor Fati: Love Your Fate",
          excerpt: "The Stoic practice of embracing whatever happens as necessary and even desirable.",
          date: "2025-11-10",
          readTime: "7 min",
          tags: JSON.stringify(["stoicism", "acceptance"]),
          featured: false,
          content: JSON.stringify([
            { type: "paragraph", text: "Amor fati—love of fate—is perhaps the most challenging yet rewarding Stoic practice. It asks us not merely to accept what happens, but to embrace it wholeheartedly." },
          ]),
        },
        {
          slug: "obstacle-is-the-way",
          title: "The Obstacle Is The Way",
          excerpt: "How impediments to action advance action. What stands in the way becomes the way.",
          date: "2025-10-22",
          readTime: "9 min",
          tags: JSON.stringify(["stoicism", "resilience"]),
          featured: false,
          content: JSON.stringify([
            { type: "paragraph", text: "Marcus Aurelius wrote: 'The impediment to action advances action. What stands in the way becomes the way.' This paradoxical insight is at the heart of Stoic resilience." },
          ]),
        },
        {
          slug: "premeditatio-malorum",
          title: "Premeditatio Malorum",
          excerpt: "The practice of negative visualization—imagining loss to appreciate what we have.",
          date: "2025-09-14",
          readTime: "5 min",
          tags: JSON.stringify(["stoicism", "gratitude"]),
          featured: false,
          content: JSON.stringify([
            { type: "paragraph", text: "The Stoics practiced premeditatio malorum—the premeditation of evils. By imagining potential losses, they cultivated gratitude for what they had and prepared themselves for adversity." },
          ]),
        },
        {
          slug: "living-according-to-nature",
          title: "On Living According to Nature",
          excerpt: "What does it mean to live in accordance with nature? Marcus Aurelius on virtue and reason.",
          date: "2025-08-30",
          readTime: "10 min",
          tags: JSON.stringify(["stoicism", "virtue"]),
          featured: false,
          content: JSON.stringify([
            { type: "paragraph", text: "The Stoics believed that the key to a good life was living in accordance with nature—both our own rational nature and the nature of the cosmos." },
          ]),
        },
      ],
    });

    // Seed Projects
    await prisma.project.createMany({
      data: [
        {
          slug: "stoic-daily",
          title: "Stoic Daily",
          tagline: "A minimalist daily reflection app inspired by Stoic philosophy",
          description: "Track your progress on the path to virtue. Each day, answer a Stoic question, log your thoughts, and build a practice of philosophical reflection.",
          tech: JSON.stringify(["Next.js", "TypeScript", "Framer Motion", "Tailwind CSS", "PostgreSQL"]),
          year: "2025",
          status: "Active",
          featured: true,
          role: "Design & Development",
          links: JSON.stringify({
            live: "https://stoicdaily.app",
            github: "https://github.com/juanrizkym/stoic-daily",
          }),
          philosophy: JSON.stringify({
            quote: "No man is free who is not master of himself.",
            author: "Epictetus",
          }),
          sections: JSON.stringify([
            { title: "The Challenge", content: "In our age of distraction, the ancient practice of daily philosophical reflection has been lost. Most productivity apps focus on doing more, not being better. I wanted to create a space for the opposite—for slowing down, for asking difficult questions, for cultivating virtue." },
            { title: "The Solution", content: "Stoic Daily presents one question each day—drawn from the wisdom of Marcus Aurelius, Seneca, and Epictetus. Users can write their reflections, track their contemplation streaks, and review their growth over time." },
            { title: "Key Features", content: "• Daily Stoic Questions — Curated prompts from ancient philosophy\n• Journal Entries — Private space for reflection and writing\n• Streak Tracking — Build a practice of daily contemplation\n• Focus Mode — Distraction-free reading environment" },
            { title: "Technical Approach", content: "Built with Next.js 15 and the App Router for optimal performance. Framer Motion powers the smooth, contemplative animations. Data is stored in PostgreSQL with Prisma ORM." },
          ]),
          gallery: JSON.stringify([
            { type: "screenshot", label: "Daily Question" },
            { type: "screenshot", label: "Journal Entry" },
            { type: "screenshot", label: "Streak Calendar" },
          ]),
        },
        {
          slug: "memento-mori-timer",
          title: "Memento Mori Timer",
          tagline: "A gentle reminder of mortality",
          description: "Visualize your life in weeks and make each one count. Based on the Stoic practice of contemplating death to appreciate life.",
          tech: JSON.stringify(["React", "D3.js", "Tailwind CSS", "LocalStorage"]),
          year: "2025",
          status: "Active",
          featured: false,
          role: "Design & Development",
          links: JSON.stringify({
            live: "https://memento.juanrizky.dev",
            github: "https://github.com/juanrizkym/memento-mori",
          }),
          philosophy: JSON.stringify({
            quote: "You could leave life right now. Let that determine what you do and say and think.",
            author: "Marcus Aurelius",
          }),
          sections: JSON.stringify([
            { title: "The Concept", content: "A human life, if we're fortunate, spans about 4,000 weeks. This project visualizes that finite time—showing weeks lived and weeks remaining. The goal is not to induce anxiety, but to create clarity." },
            { title: "The Visualization", content: "Each week of your life is represented by a single square on a grid. Weeks lived are filled in gold. Weeks remaining are outlined, waiting." },
          ]),
          gallery: JSON.stringify([
            { type: "screenshot", label: "Life Grid View" },
            { type: "screenshot", label: "Week Details" },
          ]),
        },
        {
          slug: "philosophy-archive",
          title: "Philosophy Archive",
          tagline: "Curated collection of philosophical texts with modern commentary",
          description: "Ancient wisdom made accessible. Read Stoic, Epicurean, and other philosophical texts with contemporary notes and discussion.",
          tech: JSON.stringify(["Next.js", "MDX", "PostgreSQL", "Prisma"]),
          year: "2024",
          status: "Maintained",
          featured: false,
          role: "Design & Development",
          links: JSON.stringify({
            live: "https://archive.juanrizky.dev",
            github: "https://github.com/juanrizkym/philosophy-archive",
          }),
          philosophy: JSON.stringify({
            quote: "The unexamined life is not worth living.",
            author: "Socrates",
          }),
          sections: JSON.stringify([
            { title: "The Vision", content: "Philosophy should not be locked away in dusty academic volumes. The Archive brings ancient texts online with thoughtful formatting, contemporary commentary, and tools for study." },
            { title: "The Collection", content: "Currently featuring Marcus Aurelius' Meditations, Seneca's Letters, Epictetus' Enchiridion, and selections from Epicurus." },
          ]),
          gallery: JSON.stringify([
            { type: "screenshot", label: "Text Reader" },
            { type: "screenshot", label: "Commentary View" },
          ]),
        },
        {
          slug: "dichotomy-tool",
          title: "Dichotomy Tool",
          tagline: "Interactive tool for practicing the Stoic dichotomy of control",
          description: "A practical exercise for distinguishing what is within your control from what is not.",
          tech: JSON.stringify(["Vue.js", "TypeScript", "Tailwind CSS"]),
          year: "2024",
          status: "Archived",
          featured: false,
          role: "Design & Development",
          links: JSON.stringify({
            live: null,
            github: "https://github.com/juanrizkym/dichotomy-tool",
          }),
          philosophy: JSON.stringify({
            quote: "Some things are within our power, while others are not.",
            author: "Epictetus",
          }),
          sections: JSON.stringify([
            { title: "The Practice", content: "The dichotomy of control is the foundation of Stoic philosophy. This tool helps users practice it: enter a situation, drag elements into 'within control' or 'outside control' categories." },
            { title: "Why Archived", content: "This project was an early experiment. While the concept is valuable, I've since integrated similar functionality into Stoic Daily." },
          ]),
          gallery: JSON.stringify([
            { type: "screenshot", label: "Sorting Interface" },
          ]),
        },
      ],
    });

    // Seed Quotes
    await prisma.quote.createMany({
      data: [
        { text: "You have power over your mind - not outside events.", author: "Marcus Aurelius", source: "Meditations VI.32", category: "control" },
        { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", source: "Meditations V.20", category: "obstacles" },
        { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", source: "Meditations X.16", category: "action" },
        { text: "He who fears death will never do anything worthy of a living man.", author: "Seneca", source: "Letters 82", category: "death" },
        { text: "We suffer more often in imagination than in reality.", author: "Seneca", source: "Letters 13", category: "anxiety" },
        { text: "It is not things that disturb us, but our judgments about things.", author: "Epictetus", source: "Enchiridion 5", category: "perception" },
      ],
    });

    // Seed Sticky Notes
    await prisma.stickyNote.createMany({
      data: [
        {
          question: "How do you deal with setbacks?",
          answer: "I remember that the obstacle is the way. Each setback is a teacher in disguise.",
          author: "Anonymous Stoic",
          color: "gold",
          positionX: 15,
          positionY: 20,
          rotation: -3,
        },
        {
          question: "What brings you peace?",
          answer: "Focusing only on what I can control. Everything else is just weather.",
          author: "Marcus Jr.",
          color: "sage",
          positionX: 55,
          positionY: 15,
          rotation: 2,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      counts: {
        profile: 1,
        articles: 6,
        projects: 4,
        quotes: 6,
        stickyNotes: 2,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: String(error) },
      { status: 500 }
    );
  }
}
