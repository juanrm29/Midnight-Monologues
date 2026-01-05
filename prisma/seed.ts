import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

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
  console.log("✓ Profile created");

  // Seed Articles
  const articles = [
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
        { type: "paragraph", text: "The dichotomy of control is perhaps the most fundamental teaching of Stoic philosophy. At its core lies a simple yet profound distinction: some things are within our control, while others are not." },
        { type: "heading", text: "What Is Within Our Power" },
        { type: "paragraph", text: "According to Epictetus, only our own judgments, impulses, desires, and aversions are truly within our power. Everything else—our body, reputation, possessions, and the actions of others—lies outside our complete control." },
        { type: "quote", text: "Some things are within our power, while others are not. Within our power are opinion, motivation, desire, aversion, and, in a word, whatever is of our own doing; not within our power are our body, our property, reputation, office, and, in a word, whatever is not of our own doing.", author: "Epictetus" },
        { type: "heading", text: "The Path to Tranquility" },
        { type: "paragraph", text: "When we focus our energy only on what we can control—our thoughts, choices, and responses—we free ourselves from the anxiety that comes from trying to control the uncontrollable. This is the path to ataraxia, the Stoic ideal of tranquility." },
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
        { type: "paragraph", text: "Memento mori—remember that you will die. This ancient practice of reflecting on mortality is not morbid, but liberating." },
        { type: "paragraph", text: "When we truly internalize our finite nature, petty concerns fall away and what matters becomes crystal clear." },
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
      content: JSON.stringify([]),
    },
    {
      slug: "obstacle-is-the-way",
      title: "The Obstacle Is The Way",
      excerpt: "How impediments to action advance action. What stands in the way becomes the way.",
      date: "2025-10-22",
      readTime: "9 min",
      tags: JSON.stringify(["stoicism", "resilience"]),
      featured: false,
      content: JSON.stringify([]),
    },
    {
      slug: "premeditatio-malorum",
      title: "Premeditatio Malorum",
      excerpt: "The practice of negative visualization—imagining loss to appreciate what we have.",
      date: "2025-09-14",
      readTime: "5 min",
      tags: JSON.stringify(["stoicism", "gratitude"]),
      featured: false,
      content: JSON.stringify([]),
    },
    {
      slug: "living-according-to-nature",
      title: "On Living According to Nature",
      excerpt: "What does it mean to live in accordance with nature? Marcus Aurelius on virtue and reason.",
      date: "2025-08-30",
      readTime: "10 min",
      tags: JSON.stringify(["stoicism", "virtue"]),
      featured: false,
      content: JSON.stringify([]),
    },
  ];

  for (const article of articles) {
    await prisma.article.create({ data: article });
  }
  console.log(`✓ ${articles.length} articles created`);

  // Seed Projects
  const projects = [
    {
      slug: "stoic-daily",
      title: "Stoic Daily",
      description: "A minimalist daily reflection app inspired by Stoic philosophy. Track your progress on the path to virtue.",
      tech: JSON.stringify(["Next.js", "TypeScript", "Framer Motion"]),
      year: "2025",
      status: "Active",
      featured: true,
      role: "Creator & Developer",
      philosophy: JSON.stringify({
        text: "Waste no more time arguing what a good man should be. Be one.",
        author: "Marcus Aurelius",
      }),
    },
    {
      slug: "memento-mori-timer",
      title: "Memento Mori Timer",
      description: "A gentle reminder of mortality. Visualize your life in weeks and make each one count.",
      tech: JSON.stringify(["React", "D3.js", "Tailwind"]),
      year: "2025",
      status: "Active",
      featured: false,
    },
    {
      slug: "philosophy-archive",
      title: "Philosophy Archive",
      description: "Curated collection of philosophical texts with modern commentary and discussion.",
      tech: JSON.stringify(["Next.js", "MDX", "PostgreSQL"]),
      year: "2024",
      status: "Maintained",
      featured: false,
    },
    {
      slug: "dichotomy-tool",
      title: "Dichotomy Tool",
      description: "Interactive tool to practice the Stoic dichotomy of control in daily situations.",
      tech: JSON.stringify(["Vue.js", "TypeScript"]),
      year: "2024",
      status: "Archived",
      featured: false,
    },
  ];

  for (const project of projects) {
    await prisma.project.create({ data: project });
  }
  console.log(`✓ ${projects.length} projects created`);

  // Seed Quotes
  const quotes = [
    { text: "You have power over your mind - not outside events.", author: "Marcus Aurelius", source: "Meditations VI.32", category: "control" },
    { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", source: "Meditations V.20", category: "obstacles" },
    { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", source: "Meditations X.16", category: "action" },
    { text: "He who fears death will never do anything worthy of a living man.", author: "Seneca", source: "Letters 82", category: "death" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca", source: "Letters 13", category: "anxiety" },
    { text: "It is not things that disturb us, but our judgments about things.", author: "Epictetus", source: "Enchiridion 5", category: "perception" },
  ];

  for (const quote of quotes) {
    await prisma.quote.create({ data: quote });
  }
  console.log(`✓ ${quotes.length} quotes created`);

  // Seed Sticky Notes
  const notes = [
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
  ];

  for (const note of notes) {
    await prisma.stickyNote.create({ data: note });
  }
  console.log(`✓ ${notes.length} sticky notes created`);

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
