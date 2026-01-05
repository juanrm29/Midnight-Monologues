"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

interface ProjectSection {
  title: string;
  content: string;
}

interface ProjectGallery {
  type: string;
  label: string;
}

interface Project {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  year: string;
  status: string;
  role: string;
  tech: string[];
  featured: boolean;
  links: {
    live: string | null;
    github: string | null;
  };
  philosophy: {
    quote: string;
    author: string;
  };
  sections: ProjectSection[];
  gallery: ProjectGallery[];
}

// ═══════════════════════════════════════════════════════════════════
// PROJECT PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Fetch project from API
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (res.ok) {
          const data = await res.json();
          // Parse JSON fields if they're strings
          const parsedProject: Project = {
            ...data,
            tech: typeof data.tech === 'string' ? JSON.parse(data.tech) : data.tech,
            links: typeof data.links === 'string' ? JSON.parse(data.links) : data.links,
            philosophy: typeof data.philosophy === 'string' ? JSON.parse(data.philosophy) : data.philosophy,
            sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : (data.sections || []),
            gallery: typeof data.gallery === 'string' ? JSON.parse(data.gallery) : (data.gallery || []),
          };
          setProject(parsedProject);
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [slug]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.back();
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        setActiveSection(prev => Math.min(prev + 1, (project?.sections.length || 1) - 1));
      }
      if (e.key === 'ArrowUp' || e.key === 'k') {
        setActiveSection(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [router, project]);

  if (!mounted) return null;

  // Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 rounded-full mx-auto mb-4"
            style={{ 
              borderColor: 'var(--border-secondary)',
              borderTopColor: 'var(--accent-gold)',
            }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading project...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!project) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <p className="text-6xl mb-4" style={{ color: 'var(--accent-gold)' }}>∅</p>
          <h1 className="text-2xl font-light mb-4" style={{ color: 'var(--text-primary)' }}>
            Project Not Found
          </h1>
          <Link 
            href="/?view=work"
            className="text-sm underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            Return to the workshop
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'var(--accent-gold)';
      case 'Maintained': return 'var(--text-secondary)';
      case 'Archived': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <main 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 px-6 py-4"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-secondary)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            href="/?view=work"
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>←</span>
            <span>Back to Work</span>
          </Link>

          <div className="flex items-center gap-4">
            {project.links.live && (
              <a
                href={project.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full text-xs transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--accent-gold)',
                  color: 'var(--bg-primary)',
                }}
              >
                Visit Live →
              </a>
            )}
            {project.links.github && (
              <a
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full text-xs transition-all hover:opacity-80"
                style={{ 
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                Source
              </a>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Project Title with Parallax */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              transform: `translateX(${(mousePos.x - 0.5) * 20}px) translateY(${(mousePos.y - 0.5) * 10}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            {/* Status Badge */}
            <div className="flex items-center gap-3 mb-6">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStatusColor(project.status) }}
              />
              <span 
                className="text-xs uppercase tracking-widest"
                style={{ color: getStatusColor(project.status) }}
              >
                {project.status}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{project.year}</span>
            </div>

            {/* Title */}
            <h1 
              className="text-5xl sm:text-7xl font-extralight leading-tight mb-6"
              style={{ color: 'var(--text-primary)' }}
            >
              {project.title}
            </h1>

            {/* Tagline */}
            <p 
              className="text-xl sm:text-2xl font-light max-w-2xl mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              {project.tagline}
            </p>

            {/* Description */}
            <p 
              className="text-base max-w-2xl mb-12"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {project.description}
            </p>
          </motion.div>

          {/* Meta Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 border-y"
            style={{ borderColor: 'var(--border-secondary)' }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                Role
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {project.role}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                Year
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {project.year}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                Technologies
              </p>
              <div className="flex flex-wrap gap-2">
                {project.tech.map(t => (
                  <span 
                    key={t}
                    className="text-xs px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Quote */}
      <section className="py-16 px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div 
            className="py-12 px-8 rounded-xl"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <p 
              className="text-2xl sm:text-3xl font-extralight italic mb-6 leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              &ldquo;{project.philosophy.quote}&rdquo;
            </p>
            <p className="text-sm" style={{ color: 'var(--accent-gold)' }}>
              — {project.philosophy.author}
            </p>
          </div>
        </motion.div>
      </section>

      {/* Project Sections - Interactive */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Section Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-3"
            >
              <div className="lg:sticky lg:top-32">
                <p 
                  className="text-xs uppercase tracking-widest mb-6"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Sections
                </p>
                <nav className="space-y-1">
                  {project.sections.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSection(index)}
                      className="w-full text-left px-4 py-3 rounded-lg transition-all"
                      style={{
                        backgroundColor: activeSection === index ? 'var(--bg-elevated)' : 'transparent',
                        color: activeSection === index ? 'var(--text-primary)' : 'var(--text-muted)',
                        borderLeft: activeSection === index ? '2px solid var(--accent-gold)' : '2px solid transparent',
                      }}
                    >
                      <span className="text-sm">{section.title}</span>
                    </button>
                  ))}
                </nav>

                {/* Keyboard hint */}
                <p 
                  className="text-[10px] mt-8 opacity-50"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Navigate with ↑↓ or J/K
                </p>
              </div>
            </motion.div>

            {/* Section Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-9"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 sm:p-12 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <h2 
                    className="text-2xl font-light mb-8"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {project.sections[activeSection].title}
                  </h2>
                  
                  <div 
                    className="text-base leading-[1.85] whitespace-pre-line"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {project.sections[activeSection].content}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery Placeholder */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p 
            className="text-xs uppercase tracking-widest mb-8 text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            Gallery
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {project.gallery.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="aspect-video rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <div className="text-center">
                  <p className="text-4xl mb-4 opacity-30">📸</p>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {item.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <footer 
        className="py-12 px-6 border-t"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            ← All projects
          </Link>
          
          <div className="flex items-center gap-4">
            {project.links.live && (
              <a
                href={project.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent-gold)' }}
              >
                Visit Live →
              </a>
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}
