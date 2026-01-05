// ═══════════════════════════════════════════════════════════════════
// CONTENT STORE - Centralized content management
// "The soul becomes dyed with the color of its thoughts" - Marcus Aurelius
// ═══════════════════════════════════════════════════════════════════

const CONTENT_KEY = "stoic_content_store";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  featured: boolean;
  epigraph?: {
    text: string;
    author: string;
    source: string;
  };
  content: ContentBlock[];
}

export interface ContentBlock {
  type: "paragraph" | "heading" | "quote";
  text: string;
  author?: string;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  description: string;
  tech: string[];
  year: string;
  status: "Active" | "Maintained" | "Archived";
  featured: boolean;
  role?: string;
  links?: { live?: string; github?: string };
  philosophy?: { text: string; author: string };
  sections?: ProjectSection[];
}

export interface ProjectSection {
  id: string;
  title: string;
  content: string;
}

export interface Profile {
  name: string;
  title: string;
  bio: string;
  avatar?: string;
  location?: string;
  email?: string;
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface Quote {
  id: number;
  text: string;
  author: string;
  source: string;
  category?: string;
}

export interface StickyNote {
  id: number;
  question: string;
  answer: string;
  author: string;
  color: "gold" | "sage" | "marble" | "bronze";
  position: { x: number; y: number };
  rotation: number;
  createdAt: string;
}

export interface ContentStore {
  articles: Article[];
  projects: Project[];
  profile: Profile;
  quotes: Quote[];
  stickyNotes: StickyNote[];
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT DATA
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_ARTICLES: Article[] = [
  {
    id: 1,
    slug: "dichotomy-of-control",
    title: "The Dichotomy of Control",
    excerpt: "On distinguishing what is within our power and what is not—and why this matters for peace of mind.",
    date: "2025-12-15",
    readTime: "8 min",
    tags: ["stoicism", "philosophy"],
    featured: true,
    epigraph: {
      text: "Make the best use of what is in your power, and take the rest as it happens.",
      author: "Epictetus",
      source: "Enchiridion"
    },
    content: [
      { type: "paragraph", text: "The dichotomy of control is perhaps the most fundamental teaching of Stoic philosophy..." },
      { type: "heading", text: "What Is Within Our Power" },
      { type: "paragraph", text: "According to Epictetus, only our own judgments, impulses, desires, and aversions are truly within our power..." }
    ]
  },
  {
    id: 2,
    slug: "memento-mori",
    title: "Memento Mori: Remember You Must Die",
    excerpt: "How contemplating mortality clarifies what truly matters and liberates us from trivial concerns.",
    date: "2025-11-28",
    readTime: "6 min",
    tags: ["stoicism", "death"],
    featured: false,
    content: []
  },
  {
    id: 3,
    slug: "amor-fati",
    title: "Amor Fati: Love Your Fate",
    excerpt: "The Stoic practice of embracing whatever happens as necessary and even desirable.",
    date: "2025-11-10",
    readTime: "7 min",
    tags: ["stoicism", "acceptance"],
    featured: false,
    content: []
  },
  {
    id: 4,
    slug: "obstacle-is-the-way",
    title: "The Obstacle Is The Way",
    excerpt: "How impediments to action advance action. What stands in the way becomes the way.",
    date: "2025-10-22",
    readTime: "9 min",
    tags: ["stoicism", "resilience"],
    featured: false,
    content: []
  },
  {
    id: 5,
    slug: "premeditatio-malorum",
    title: "Premeditatio Malorum",
    excerpt: "The practice of negative visualization—imagining loss to appreciate what we have.",
    date: "2025-09-14",
    readTime: "5 min",
    tags: ["stoicism", "gratitude"],
    featured: false,
    content: []
  },
  {
    id: 6,
    slug: "living-according-to-nature",
    title: "On Living According to Nature",
    excerpt: "What does it mean to live in accordance with nature? Marcus Aurelius on virtue and reason.",
    date: "2025-08-30",
    readTime: "10 min",
    tags: ["stoicism", "virtue"],
    featured: false,
    content: []
  }
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 1,
    slug: "stoic-daily",
    title: "Stoic Daily",
    description: "A minimalist daily reflection app inspired by Stoic philosophy. Track your progress on the path to virtue.",
    tech: ["Next.js", "TypeScript", "Framer Motion"],
    year: "2025",
    status: "Active",
    featured: true,
    role: "Creator & Developer",
    philosophy: {
      text: "Waste no more time arguing what a good man should be. Be one.",
      author: "Marcus Aurelius"
    }
  },
  {
    id: 2,
    slug: "memento-mori-timer",
    title: "Memento Mori Timer",
    description: "A gentle reminder of mortality. Visualize your life in weeks and make each one count.",
    tech: ["React", "D3.js", "Tailwind"],
    year: "2025",
    status: "Active",
    featured: false
  },
  {
    id: 3,
    slug: "philosophy-archive",
    title: "Philosophy Archive",
    description: "Curated collection of philosophical texts with modern commentary and discussion.",
    tech: ["Next.js", "MDX", "PostgreSQL"],
    year: "2024",
    status: "Maintained",
    featured: false
  },
  {
    id: 4,
    slug: "dichotomy-tool",
    title: "Dichotomy Tool",
    description: "Interactive tool to practice the Stoic dichotomy of control in daily situations.",
    tech: ["Vue.js", "TypeScript"],
    year: "2024",
    status: "Archived",
    featured: false
  }
];

const DEFAULT_PROFILE: Profile = {
  name: "Juan Rizky Maulana",
  title: "Developer & Stoic Practitioner",
  bio: "Building thoughtful software guided by ancient wisdom. Exploring the intersection of technology and philosophy.",
  location: "Indonesia",
  email: "hello@juanrizky.dev",
  social: {
    github: "https://github.com/juanrizky",
    twitter: "https://twitter.com/juanrizky",
    linkedin: "https://linkedin.com/in/juanrizky"
  }
};

const DEFAULT_QUOTES: Quote[] = [
  { id: 1, text: "You have power over your mind - not outside events.", author: "Marcus Aurelius", source: "Meditations VI.32", category: "control" },
  { id: 2, text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", source: "Meditations V.20", category: "obstacles" },
  { id: 3, text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", source: "Meditations X.16", category: "action" },
  { id: 4, text: "He who fears death will never do anything worthy of a living man.", author: "Seneca", source: "Letters 82", category: "death" },
  { id: 5, text: "We suffer more often in imagination than in reality.", author: "Seneca", source: "Letters 13", category: "anxiety" },
  { id: 6, text: "It is not things that disturb us, but our judgments about things.", author: "Epictetus", source: "Enchiridion 5", category: "perception" }
];

const DEFAULT_STICKY_NOTES: StickyNote[] = [
  {
    id: 1,
    question: "How do you deal with setbacks?",
    answer: "I remember that the obstacle is the way. Each setback is a teacher in disguise.",
    author: "Anonymous Stoic",
    color: "gold",
    position: { x: 15, y: 20 },
    rotation: -3,
    createdAt: "2025-01-01"
  },
  {
    id: 2,
    question: "What brings you peace?",
    answer: "Focusing only on what I can control. Everything else is just weather.",
    author: "Marcus Jr.",
    color: "sage",
    position: { x: 55, y: 15 },
    rotation: 2,
    createdAt: "2025-01-02"
  }
];

// ═══════════════════════════════════════════════════════════════════
// STORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function getDefaultStore(): ContentStore {
  return {
    articles: DEFAULT_ARTICLES,
    projects: DEFAULT_PROJECTS,
    profile: DEFAULT_PROFILE,
    quotes: DEFAULT_QUOTES,
    stickyNotes: DEFAULT_STICKY_NOTES,
    lastUpdated: new Date().toISOString()
  };
}

export function getContentStore(): ContentStore {
  if (typeof window === "undefined") {
    return getDefaultStore();
  }
  
  const stored = localStorage.getItem(CONTENT_KEY);
  if (!stored) {
    const defaultStore = getDefaultStore();
    localStorage.setItem(CONTENT_KEY, JSON.stringify(defaultStore));
    return defaultStore;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return getDefaultStore();
  }
}

export function saveContentStore(store: ContentStore): void {
  if (typeof window === "undefined") return;
  store.lastUpdated = new Date().toISOString();
  localStorage.setItem(CONTENT_KEY, JSON.stringify(store));
}

// ═══════════════════════════════════════════════════════════════════
// ARTICLES CRUD
// ═══════════════════════════════════════════════════════════════════

export function getArticles(): Article[] {
  return getContentStore().articles;
}

export function getArticle(id: number): Article | undefined {
  return getContentStore().articles.find(a => a.id === id);
}

export function saveArticle(article: Article): void {
  const store = getContentStore();
  const index = store.articles.findIndex(a => a.id === article.id);
  if (index >= 0) {
    store.articles[index] = article;
  } else {
    article.id = Math.max(0, ...store.articles.map(a => a.id)) + 1;
    store.articles.push(article);
  }
  saveContentStore(store);
}

export function deleteArticle(id: number): void {
  const store = getContentStore();
  store.articles = store.articles.filter(a => a.id !== id);
  saveContentStore(store);
}

// ═══════════════════════════════════════════════════════════════════
// PROJECTS CRUD
// ═══════════════════════════════════════════════════════════════════

export function getProjects(): Project[] {
  return getContentStore().projects;
}

export function getProject(id: number): Project | undefined {
  return getContentStore().projects.find(p => p.id === id);
}

export function saveProject(project: Project): void {
  const store = getContentStore();
  const index = store.projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    store.projects[index] = project;
  } else {
    project.id = Math.max(0, ...store.projects.map(p => p.id)) + 1;
    store.projects.push(project);
  }
  saveContentStore(store);
}

export function deleteProject(id: number): void {
  const store = getContentStore();
  store.projects = store.projects.filter(p => p.id !== id);
  saveContentStore(store);
}

// ═══════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════

export function getProfile(): Profile {
  return getContentStore().profile;
}

export function saveProfile(profile: Profile): void {
  const store = getContentStore();
  store.profile = profile;
  saveContentStore(store);
}

// ═══════════════════════════════════════════════════════════════════
// QUOTES CRUD
// ═══════════════════════════════════════════════════════════════════

export function getQuotes(): Quote[] {
  return getContentStore().quotes;
}

export function getQuote(id: number): Quote | undefined {
  return getContentStore().quotes.find(q => q.id === id);
}

export function saveQuote(quote: Quote): void {
  const store = getContentStore();
  const index = store.quotes.findIndex(q => q.id === quote.id);
  if (index >= 0) {
    store.quotes[index] = quote;
  } else {
    quote.id = Math.max(0, ...store.quotes.map(q => q.id)) + 1;
    store.quotes.push(quote);
  }
  saveContentStore(store);
}

export function deleteQuote(id: number): void {
  const store = getContentStore();
  store.quotes = store.quotes.filter(q => q.id !== id);
  saveContentStore(store);
}

// ═══════════════════════════════════════════════════════════════════
// STICKY NOTES CRUD
// ═══════════════════════════════════════════════════════════════════

export function getStickyNotes(): StickyNote[] {
  return getContentStore().stickyNotes;
}

export function getStickyNote(id: number): StickyNote | undefined {
  return getContentStore().stickyNotes.find(n => n.id === id);
}

export function saveStickyNote(note: StickyNote): void {
  const store = getContentStore();
  const index = store.stickyNotes.findIndex(n => n.id === note.id);
  if (index >= 0) {
    store.stickyNotes[index] = note;
  } else {
    note.id = Math.max(0, ...store.stickyNotes.map(n => n.id)) + 1;
    store.stickyNotes.push(note);
  }
  saveContentStore(store);
}

export function deleteStickyNote(id: number): void {
  const store = getContentStore();
  store.stickyNotes = store.stickyNotes.filter(n => n.id !== id);
  saveContentStore(store);
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════

export function resetToDefaults(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONTENT_KEY);
  localStorage.setItem(CONTENT_KEY, JSON.stringify(getDefaultStore()));
}

export function exportContent(): string {
  return JSON.stringify(getContentStore(), null, 2);
}

export function importContent(json: string): boolean {
  try {
    const data = JSON.parse(json) as ContentStore;
    saveContentStore(data);
    return true;
  } catch {
    return false;
  }
}
