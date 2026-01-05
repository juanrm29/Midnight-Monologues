"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { markdownToHtml, markdownStyles, isMarkdownContent } from "@/lib/markdown";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ContentBlock {
  type: "paragraph" | "heading" | "quote";
  text: string;
  author?: string;
}

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
  epigraph?: {
    text: string;
    author: string;
    source: string;
  };
  content: ContentBlock[] | string;
}

// ═══════════════════════════════════════════════════════════════════
// ARTICLE PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/articles/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        }
      } catch (error) {
        console.error("Failed to fetch article:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  // Read progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / scrollHeight) * 100;
      setReadProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        setFocusMode(prev => !prev);
      }
      if (e.key === 'Escape') {
        if (focusMode) {
          setFocusMode(false);
        } else {
          router.back();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [focusMode, router]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-2xl"
          style={{ color: "var(--accent-gold)" }}
        >
          ◐
        </motion.div>
      </div>
    );
  }

  if (!article) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <p className="text-6xl mb-4" style={{ color: 'var(--accent-gold)' }}>∅</p>
          <h1 className="text-2xl font-light mb-4" style={{ color: 'var(--text-primary)' }}>
            Article Not Found
          </h1>
          <Link 
            href="/?view=writing"
            className="text-sm underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            Return to Writing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Focus Mode Vignette - dims edges, keeps center clear */}
      <AnimatePresence>
        {focusMode && (
          <>
            {/* Top vignette */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 right-0 h-32 z-40 pointer-events-none"
              style={{ 
                background: 'linear-gradient(to bottom, var(--bg-primary) 0%, transparent 100%)',
              }}
            />
            {/* Bottom vignette */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 h-32 z-40 pointer-events-none"
              style={{ 
                background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 100%)',
              }}
            />
            {/* Left vignette */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 bottom-0 w-1/4 z-40 pointer-events-none"
              style={{ 
                background: 'linear-gradient(to right, var(--bg-primary) 0%, transparent 100%)',
              }}
            />
            {/* Right vignette */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 right-0 bottom-0 w-1/4 z-40 pointer-events-none"
              style={{ 
                background: 'linear-gradient(to left, var(--bg-primary) 0%, transparent 100%)',
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-px z-50"
        style={{ 
          backgroundColor: 'var(--accent-gold)',
          scaleX: readProgress / 100,
          transformOrigin: 'left',
        }}
      />

      <div 
        className="min-h-screen relative z-10"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 left-6 z-50"
        >
          <Link 
            href="/?view=writing"
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>←</span>
            <span>Back to Writing</span>
          </Link>
        </motion.div>

        {/* Focus Mode Toggle */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setFocusMode(prev => !prev)}
          className="fixed top-6 right-6 z-50 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          {focusMode ? '◉ Focus' : '○ Focus'}
        </motion.button>

        {/* Article Content */}
        <article className="max-w-2xl mx-auto px-6 py-24 sm:py-32">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            {/* Meta */}
            <div className="flex items-center gap-4 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>{article.date}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>

            {/* Title */}
            <h1 
              className="text-3xl sm:text-4xl font-light leading-tight mb-6"
              style={{ color: 'var(--text-primary)' }}
            >
              {article.title}
            </h1>

            {/* Excerpt */}
            <p 
              className="text-lg font-light leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {article.excerpt}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-6">
              {article.tags.map((tag: string) => (
                <span 
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{ 
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.header>

          {/* Epigraph */}
          {article.epigraph && (
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-16 pl-6"
              style={{ borderLeft: '2px solid var(--accent-gold)' }}
            >
              <p 
                className="text-lg italic mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                &ldquo;{article.epigraph.text}&rdquo;
              </p>
              <footer style={{ color: 'var(--text-muted)' }}>
                — {article.epigraph.author}, <cite>{article.epigraph.source}</cite>
              </footer>
            </motion.blockquote>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Inject markdown styles */}
            <style dangerouslySetInnerHTML={{ __html: markdownStyles }} />
            
            {isMarkdownContent(article.content) ? (
              // Markdown content - render with shared styles
              <div 
                className="prose-markdown"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content) }} 
              />
            ) : (
              // Legacy ContentBlock format
              <div className="prose-stoic">
                {article.content.map((block: ContentBlock, index: number) => {
                  if (block.type === 'heading') {
                    return (
                      <h2 
                        key={index}
                        className="text-xl font-light mt-12 mb-6"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {block.text}
                      </h2>
                    );
                  }
                  
                  if (block.type === 'quote') {
                    return (
                      <blockquote 
                        key={index}
                        className="my-8 pl-6"
                        style={{ borderLeft: '2px solid var(--border-secondary)' }}
                      >
                        <p 
                          className="text-lg italic mb-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          &ldquo;{block.text}&rdquo;
                        </p>
                        {block.author && (
                          <footer style={{ color: 'var(--text-muted)' }}>
                            — {block.author}
                          </footer>
                        )}
                      </blockquote>
                    );
                  }
                  
                  return (
                    <p 
                      key={index}
                      className="text-base leading-relaxed mb-6"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {block.text}
                    </p>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-24 pt-12"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            <div className="flex items-center justify-between">
              <Link 
                href="/"
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                ← More writings
              </Link>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {Math.round(readProgress)}% read
              </div>
            </div>
          </motion.footer>
        </article>
      </div>
    </>
  );
}
