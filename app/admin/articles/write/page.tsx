"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { markdownToHtml, markdownStyles } from "@/lib/markdown";

// ═══════════════════════════════════════════════════════════════════
// iA WRITER STYLE MARKDOWN EDITOR
// "The first draft is just you telling yourself the story." - Terry Pratchett
// ═══════════════════════════════════════════════════════════════════

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  featured: boolean;
  content: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function calculateReadTime(text: string): string {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

// Auto-generate excerpt from content (first paragraph, max 150 chars)
function generateExcerpt(content: string): string {
  // Remove markdown syntax
  const plainText = content
    .replace(/^#+\s+/gm, "") // headers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/`([^`]+)`/g, "$1") // code
    .replace(/^>\s+/gm, "") // quotes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^---$/gm, "") // hr
    .trim();
  
  // Get first paragraph
  const firstParagraph = plainText.split(/\n\n/)[0] || "";
  
  // Truncate to 150 chars
  if (firstParagraph.length <= 150) return firstParagraph;
  return firstParagraph.slice(0, 147).trim() + "...";
}

// Auto-extract tags from content using keyword detection
function extractTags(content: string, title: string): string[] {
  const text = (title + " " + content).toLowerCase();
  
  // Common topic keywords to detect
  const tagKeywords: Record<string, string[]> = {
    "stoicism": ["stoic", "stoicism", "marcus aurelius", "seneca", "epictetus", "meditations"],
    "philosophy": ["philosophy", "philosophical", "wisdom", "virtue", "ethics", "moral"],
    "mindfulness": ["mindful", "mindfulness", "present", "awareness", "meditation", "calm"],
    "productivity": ["productivity", "productive", "efficiency", "focus", "work", "routine"],
    "life": ["life", "living", "existence", "death", "mortality", "meaning"],
    "growth": ["growth", "improve", "development", "learning", "progress", "change"],
    "reflection": ["reflect", "reflection", "contemplat", "introspect", "think"],
    "nature": ["nature", "natural", "universe", "cosmos", "world"],
    "control": ["control", "power", "choice", "decision", "will"],
    "acceptance": ["accept", "acceptance", "fate", "amor fati", "embrace"],
    "resilience": ["resilience", "adversity", "obstacle", "challenge", "struggle", "hardship"],
    "time": ["time", "moment", "present", "future", "past", "today"],
    "death": ["death", "mortality", "memento mori", "dying", "end"],
    "essay": ["essay", "writing", "thoughts", "reflection"],
    "personal": ["personal", "experience", "story", "journey", "my"],
  };
  
  const detectedTags: string[] = [];
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        detectedTags.push(tag);
        break;
      }
    }
  }
  
  // Return max 4 tags
  return detectedTags.slice(0, 4);
}

export default function MarkdownWriter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("id");
  
  const [article, setArticle] = useState<Article>({
    id: 0,
    slug: "",
    title: "",
    excerpt: "",
    date: new Date().toISOString().split("T")[0],
    readTime: "1 min",
    tags: [],
    featured: false,
    content: ""
  });
  
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [typewriterMode, setTypewriterMode] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [currentLine, setCurrentLine] = useState(1);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Force light theme for CMS write page
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    
    if (articleId) {
      loadArticle(articleId);
    }
    
    // Restore theme when leaving
    return () => {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(savedTheme === 'light' ? 'light' : 'dark');
    };
  }, [articleId]);

  useEffect(() => {
    const text = article.content;
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    setWordCount(words);
    setCharCount(chars);
  }, [article.content]);

  const saveArticle = useCallback(async (redirect: boolean = true) => {
    setSaving(true);
    
    // Save content as raw markdown string (not ContentBlocks)
    const rawMarkdownContent = article.content;

    // Auto-generate excerpt if empty
    const autoExcerpt = article.excerpt.trim() || generateExcerpt(article.content);
    
    // Auto-generate tags if empty
    const autoTags = article.tags.length > 0 ? article.tags : extractTags(article.content, article.title);

    const articleToSave = {
      ...article,
      slug: article.slug || generateSlug(article.title),
      readTime: calculateReadTime(article.content),
      content: rawMarkdownContent,
      excerpt: autoExcerpt,
      tags: autoTags,
    };

    try {
      const isNew = article.id === 0;
      const url = isNew ? "/api/articles" : `/api/articles/${article.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleToSave),
      });
      
      if (res.ok) {
        const savedArticle = await res.json();
        if (isNew) {
          setArticle(prev => ({ ...prev, id: savedArticle.id }));
        }
        setLastSaved(new Date());
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        
        if (redirect) {
          setTimeout(() => router.push("/admin/articles"), 500);
        }
      }
    } catch {
      alert("Failed to save article");
    } finally {
      setSaving(false);
    }
  }, [article, router]);

  const handleAutoSave = useCallback(async () => {
    if (!article.title.trim()) return;
    await saveArticle(false);
  }, [article.title, saveArticle]);

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    if (article.title || article.content) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 5000);
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [article, handleAutoSave]);

  useEffect(() => {
    if (typewriterMode && editorRef.current) {
      const editor = editorRef.current;
      const lineHeight = 32;
      const viewportMiddle = editor.clientHeight / 2;
      const targetScroll = (currentLine * lineHeight) - viewportMiddle;
      
      editor.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: "smooth"
      });
    }
  }, [currentLine, typewriterMode]);

  const loadArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`);
      if (res.ok) {
        const data = await res.json();
        let markdownContent = "";
        if (typeof data.content === "string") {
          markdownContent = data.content;
        } else if (Array.isArray(data.content)) {
          markdownContent = data.content.map((block: { type: string; text: string }) => {
            if (block.type === "heading") return `## ${block.text}`;
            if (block.type === "quote") return `> ${block.text}`;
            return block.text;
          }).join("\n\n");
        }
        setArticle({ ...data, content: markdownContent });
      }
    } catch (error) {
      console.error("Failed to load article:", error);
    }
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setArticle({ ...article, content: e.target.value });
  };

  const handleEditorKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    updateCursorPosition(e.currentTarget);
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    updateCursorPosition(e.currentTarget);
  };

  const updateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const value = textarea.value;
    const selectionStart = textarea.selectionStart;
    
    const textBeforeCursor = value.substring(0, selectionStart);
    const lines = textBeforeCursor.split("\n");
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    
    setCurrentLine(line);
    setCursorPosition({ line, col });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      saveArticle(false);
    }
    
    if ((e.metaKey || e.ctrlKey) && e.key === "p") {
      e.preventDefault();
      setShowPreview(!showPreview);
    }
    
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      setArticle({ ...article, content: newValue });
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selectedText = value.substring(start, end);
    
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    setArticle({ ...article, content: newValue });
    
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + before.length;
      }
    }, 0);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="font-mono text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: "var(--bg-primary)",
        transition: "background-color 0.5s ease"
      }}
    >
      <style jsx global>{`
        .md-h1 { font-size: 2rem; font-weight: 300; margin: 1.5rem 0 1rem; color: var(--text-primary); }
        .md-h2 { font-size: 1.5rem; font-weight: 300; margin: 1.25rem 0 0.75rem; color: var(--text-primary); }
        .md-h3 { font-size: 1.25rem; font-weight: 400; margin: 1rem 0 0.5rem; color: var(--text-primary); }
        .md-p { margin: 0 0 1rem; line-height: 1.8; color: var(--text-secondary); }
        .md-quote { border-left: 3px solid var(--accent-gold); padding-left: 1rem; color: var(--text-tertiary); font-style: italic; margin: 1rem 0; }
        .md-hr { border: none; border-top: 1px solid var(--border-primary); margin: 2rem 0; }
        .md-link { color: var(--accent-gold); text-decoration: underline; }
        .md-code { background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: var(--text-secondary); }
        
        .editor-container::-webkit-scrollbar { width: 6px; }
        .editor-container::-webkit-scrollbar-track { background: transparent; }
        .editor-container::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 3px; }
      `}</style>

      {/* Top Bar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${focusMode ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
        style={{ 
          backgroundColor: "var(--bg-primary)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border-secondary)"
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/articles")}
              className="text-xs font-mono transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              ← back
            </button>
            <div className="h-4 w-px" style={{ backgroundColor: "var(--border-primary)" }} />
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {article.title ? `${generateSlug(article.title)}.md` : "untitled.md"}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>saving...</motion.span>
              ) : saved ? (
                <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs font-mono" style={{ color: "var(--accent-gold)" }}>✓ saved</motion.span>
              ) : null}
            </AnimatePresence>

            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <button onClick={() => setFocusMode(!focusMode)}
                className={`px-2 py-1 rounded text-xs font-mono transition-all ${focusMode ? "bg-[var(--bg-elevated)]" : ""}`}
                style={{ color: focusMode ? "var(--accent-gold)" : "var(--text-muted)" }}>focus</button>
              <button onClick={() => setTypewriterMode(!typewriterMode)}
                className={`px-2 py-1 rounded text-xs font-mono transition-all ${typewriterMode ? "bg-[var(--bg-elevated)]" : ""}`}
                style={{ color: typewriterMode ? "var(--accent-gold)" : "var(--text-muted)" }}>typewriter</button>
              <button onClick={() => setShowPreview(!showPreview)}
                className={`px-2 py-1 rounded text-xs font-mono transition-all ${showPreview ? "bg-[var(--bg-elevated)]" : ""}`}
                style={{ color: showPreview ? "var(--accent-gold)" : "var(--text-muted)" }}>preview</button>
            </div>

            <button onClick={() => setShowMeta(!showMeta)}
              className="px-2 py-1 rounded text-xs font-mono transition-all"
              style={{ backgroundColor: showMeta ? "var(--accent-gold)" : "var(--bg-tertiary)", color: showMeta ? "var(--bg-primary)" : "var(--text-muted)" }}>meta</button>

            <button onClick={() => saveArticle(true)}
              className="px-3 py-1.5 rounded text-xs font-mono font-medium transition-all hover:brightness-110"
              style={{ backgroundColor: "var(--accent-gold)", color: "var(--bg-primary)" }}>publish</button>
          </div>
        </div>
      </motion.header>

      {/* Formatting Toolbar */}
      <AnimatePresence>
        {!focusMode && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 left-0 right-0 z-40"
            style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-secondary)" }}>
            <div className="max-w-3xl mx-auto px-6 py-2 flex items-center gap-2">
              <button onClick={() => insertMarkdown("# ")} className="px-2 py-1 rounded text-xs font-mono hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-secondary)" }}>H1</button>
              <button onClick={() => insertMarkdown("## ")} className="px-2 py-1 rounded text-xs font-mono hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-secondary)" }}>H2</button>
              <button onClick={() => insertMarkdown("### ")} className="px-2 py-1 rounded text-xs font-mono hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-secondary)" }}>H3</button>
              <div className="w-px h-4" style={{ backgroundColor: "var(--border-primary)" }} />
              <button onClick={() => insertMarkdown("**", "**")} className="px-2 py-1 rounded text-xs font-mono font-bold hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-secondary)" }}>B</button>
              <button onClick={() => insertMarkdown("*", "*")} className="px-2 py-1 rounded text-xs font-mono italic hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-secondary)" }}>I</button>
              <div className="w-px h-4" style={{ backgroundColor: "var(--border-primary)" }} />
              <button onClick={() => insertMarkdown("> ")} className="px-2 py-1 rounded text-xs font-mono hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-secondary)" }}>❝</button>
              <button onClick={() => insertMarkdown("`", "`")} className="px-2 py-1 rounded text-xs font-mono hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-secondary)" }}>{"</>"}</button>
              <button onClick={() => insertMarkdown("[", "](url)")} className="px-2 py-1 rounded text-xs font-mono hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-secondary)" }}>🔗</button>
              <button onClick={() => insertMarkdown("\n---\n")} className="px-2 py-1 rounded text-xs font-mono hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-secondary)" }}>―</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Editor Area */}
      <main className="flex transition-all duration-300" style={{ paddingTop: focusMode ? "4rem" : "6.5rem" }}>
        <div className={`flex-1 transition-all duration-300 ${showPreview ? "w-1/2" : "w-full"}`}>
          {/* Title */}
          <div className="max-w-3xl mx-auto px-6 pt-8 pb-4">
            <input type="text" value={article.title}
              onChange={(e) => setArticle({ ...article, title: e.target.value, slug: generateSlug(e.target.value) })}
              placeholder="Title" className="w-full bg-transparent border-none outline-none font-light"
              style={{ fontSize: "2.5rem", color: "var(--text-primary)", fontFamily: "'EB Garamond', Georgia, serif" }} />
          </div>

          {/* Content Editor */}
          <div className={`mx-auto px-6 pb-48 relative transition-all duration-300 ${focusMode ? "max-w-2xl" : "max-w-3xl"}`}>
            <div className="relative">
              {/* Line numbers - hidden in focus mode */}
              {!focusMode && (
                <div className="absolute left-0 top-0 bottom-0 w-8 text-right pr-4 font-mono text-xs select-none overflow-hidden" style={{ color: "var(--text-muted)" }}>
                  {article.content.split("\n").map((_, i) => (
                    <div key={i} className="leading-8" style={{ color: currentLine === i + 1 ? "var(--accent-gold)" : "var(--text-muted)", opacity: currentLine === i + 1 ? 0.8 : 0.4 }}>{i + 1}</div>
                  ))}
                </div>
              )}

              <textarea ref={editorRef} value={article.content} onChange={handleEditorChange}
                onKeyUp={handleEditorKeyUp} onKeyDown={handleKeyDown} onClick={handleEditorClick}
                placeholder={`Start writing in Markdown...

# This is a heading
## This is a subheading

Regular paragraph text. Use **bold** or *italic*.

> This is a blockquote

Use \`code\` for inline code.

---

[Link text](https://example.com)`}
                className={`w-full min-h-[60vh] bg-transparent border-none outline-none resize-none editor-container transition-all duration-300 ${focusMode ? "font-serif text-lg" : "font-mono text-base"}`}
                style={{ 
                  lineHeight: focusMode ? "2.2rem" : "2rem", 
                  color: "var(--text-primary)", 
                  paddingLeft: focusMode ? "0" : "2.5rem", 
                  caretColor: "var(--accent-gold)",
                  fontFamily: focusMode ? "'EB Garamond', Georgia, serif" : undefined
                }}
                spellCheck={false} />
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <AnimatePresence>
          {showPreview && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "50%" }} exit={{ opacity: 0, width: 0 }}
              className="border-l overflow-y-auto" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-secondary)", height: "100vh", position: "sticky", top: 0 }}>
              <style dangerouslySetInnerHTML={{ __html: markdownStyles }} />
              <div className="max-w-xl mx-auto px-8 py-16">
                <h1 className="text-3xl font-light mb-8" style={{ color: "var(--text-primary)", fontFamily: "'EB Garamond', Georgia, serif" }}>
                  {article.title || "Untitled"}
                </h1>
                <div className="prose-markdown"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content) }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Meta Panel */}
      <AnimatePresence>
        {showMeta && (
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-72 z-50 overflow-y-auto"
            style={{ backgroundColor: "var(--bg-elevated)", borderLeft: "1px solid var(--border-primary)" }}>
            <div className="p-5 pt-16 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Document Settings</h3>
                <button onClick={() => setShowMeta(false)} className="text-xs hover:opacity-70" style={{ color: "var(--text-muted)" }}>×</button>
              </div>

              {/* Auto-generated preview */}
              <div className="p-3 rounded" style={{ backgroundColor: "var(--accent-gold-dim)", border: "1px solid var(--accent-gold)" }}>
                <p className="text-xs font-mono mb-2" style={{ color: "var(--accent-gold)" }}>✦ Auto-generated</p>
                <div className="space-y-1 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                  <p>Read time: <span style={{ color: "var(--text-primary)" }}>{calculateReadTime(article.content)}</span></p>
                  <p>Tags: <span style={{ color: "var(--text-primary)" }}>
                    {extractTags(article.content, article.title).join(", ") || "none detected"}
                  </span></p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>slug</label>
                <input type="text" value={article.slug} onChange={(e) => setArticle({ ...article, slug: e.target.value })}
                  placeholder={generateSlug(article.title) || "auto-generated"}
                  className="w-full px-3 py-2 rounded text-sm font-mono"
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
              </div>

              <div>
                <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>date</label>
                <input type="date" value={article.date} onChange={(e) => setArticle({ ...article, date: e.target.value })}
                  className="w-full px-3 py-2 rounded text-sm font-mono"
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>
                  excerpt
                  {!article.excerpt.trim() && article.content.trim() && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--accent-gold-dim)", color: "var(--accent-gold)" }}>auto</span>
                  )}
                </label>
                <textarea value={article.excerpt} onChange={(e) => setArticle({ ...article, excerpt: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded text-sm resize-none"
                  placeholder={generateExcerpt(article.content) || "Auto-generated from content..."}
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
                {!article.excerpt.trim() && article.content.trim() && (
                  <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                    Preview: {generateExcerpt(article.content).slice(0, 50)}...
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>
                  tags
                  {article.tags.length === 0 && extractTags(article.content, article.title).length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--accent-gold-dim)", color: "var(--accent-gold)" }}>auto</span>
                  )}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {article.tags.length > 0 ? (
                    article.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1"
                        style={{ backgroundColor: "var(--accent-gold-dim)", color: "var(--accent-gold)" }}>
                        {tag}
                        <button onClick={() => setArticle({ ...article, tags: article.tags.filter(t => t !== tag) })} className="opacity-50 hover:opacity-100">×</button>
                      </span>
                    ))
                  ) : (
                    extractTags(article.content, article.title).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded text-xs font-mono"
                        style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", border: "1px dashed var(--border-primary)" }}>
                        {tag}
                      </span>
                    ))
                  )}
                </div>
                <input type="text" placeholder="Add tag + Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const newTag = e.currentTarget.value.trim();
                      if (!article.tags.includes(newTag)) setArticle({ ...article, tags: [...article.tags, newTag] });
                      e.currentTarget.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 rounded text-sm font-mono"
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setArticle({ ...article, featured: !article.featured })}
                  className="w-4 h-4 rounded flex items-center justify-center"
                  style={{ backgroundColor: article.featured ? "var(--accent-gold)" : "transparent", border: `1px solid ${article.featured ? "var(--accent-gold)" : "var(--border-primary)"}` }}>
                  {article.featured && <span className="text-xs" style={{ color: "var(--bg-primary)" }}>✓</span>}
                </button>
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>featured article</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Bottom Status Bar */}
      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className={`fixed bottom-0 left-0 right-0 py-2 transition-all duration-500 ${focusMode ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
        style={{ backgroundColor: "var(--bg-primary)", borderTop: "1px solid var(--border-secondary)" }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
            <span>~{calculateReadTime(article.content)}</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
            <span>Markdown</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
