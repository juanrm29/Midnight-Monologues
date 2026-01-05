"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ContentBlock {
  type: "paragraph" | "heading" | "quote";
  text: string;
  author?: string;
}

interface Article {
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

// ═══════════════════════════════════════════════════════════════════
// ARTICLES MANAGER - CRUD for blog articles
// "The art of writing is the art of discovering what you believe." - Gustave Flaubert
// ═══════════════════════════════════════════════════════════════════

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const EMPTY_ARTICLE: Article = {
  id: 0,
  slug: "",
  title: "",
  excerpt: "",
  date: new Date().toISOString().split("T")[0],
  readTime: "5 min",
  tags: [],
  featured: false,
  content: []
};

export default function ArticlesManager() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadArticles();
  }, []);

  useEffect(() => {
    if (mounted) {
      const editId = searchParams.get("edit");
      const isNew = searchParams.get("new");
      
      if (isNew) {
        setSelectedArticle({ ...EMPTY_ARTICLE });
        setIsEditing(true);
      } else if (editId) {
        const article = articles.find(a => a.id === parseInt(editId));
        if (article) {
          setSelectedArticle(article);
          setIsEditing(true);
        }
      }
    }
  }, [mounted, searchParams, articles]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedArticle) return;
    setSaving(true);
    
    // Auto-generate slug if empty
    const articleToSave = {
      ...selectedArticle,
      slug: selectedArticle.slug || generateSlug(selectedArticle.title)
    };

    try {
      const isNew = articleToSave.id === 0;
      const url = isNew ? "/api/articles" : `/api/articles/${articleToSave.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleToSave),
      });
      
      if (res.ok) {
        await loadArticles();
        setIsEditing(false);
        setSelectedArticle(null);
      }
    } catch (error) {
      console.error("Failed to save article:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadArticles();
        setShowDeleteConfirm(null);
        if (selectedArticle?.id === id) {
          setSelectedArticle(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Failed to delete article:", error);
    }
  };

  const handleAddTag = () => {
    if (!selectedArticle || !tagInput.trim()) return;
    if (!selectedArticle.tags.includes(tagInput.trim())) {
      setSelectedArticle({
        ...selectedArticle,
        tags: [...selectedArticle.tags, tagInput.trim()]
      });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    if (!selectedArticle) return;
    setSelectedArticle({
      ...selectedArticle,
      tags: selectedArticle.tags.filter(t => t !== tag)
    });
  };

  const handleAddContentBlock = (type: ContentBlock["type"]) => {
    if (!selectedArticle) return;
    setSelectedArticle({
      ...selectedArticle,
      content: [...selectedArticle.content, { type, text: "" }]
    });
  };

  const handleUpdateContentBlock = (index: number, text: string) => {
    if (!selectedArticle) return;
    const newContent = [...selectedArticle.content];
    newContent[index] = { ...newContent[index], text };
    setSelectedArticle({ ...selectedArticle, content: newContent });
  };

  const handleRemoveContentBlock = (index: number) => {
    if (!selectedArticle) return;
    setSelectedArticle({
      ...selectedArticle,
      content: selectedArticle.content.filter((_, i) => i !== index)
    });
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
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

  return (
    <div className="max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {isEditing && selectedArticle ? (
          /* Edit Mode */
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedArticle(null);
                }}
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                ← Back to articles
              </button>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedArticle(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)"
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ 
                    backgroundColor: "var(--accent-gold)",
                    color: "var(--bg-primary)"
                  }}
                >
                  Save Article
                </motion.button>
              </div>
            </div>

            {/* Editor Form */}
            <div 
              className="p-6 rounded-xl space-y-6"
              style={{ 
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-primary)"
              }}
            >
              {/* Title */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Title
                </label>
                <input
                  type="text"
                  value={selectedArticle.title}
                  onChange={(e) => setSelectedArticle({ 
                    ...selectedArticle, 
                    title: e.target.value,
                    slug: generateSlug(e.target.value)
                  })}
                  placeholder="Article title..."
                  className="w-full px-4 py-3 rounded-lg text-lg font-light focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              {/* Slug */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Slug (URL path)
                </label>
                <input
                  type="text"
                  value={selectedArticle.slug}
                  onChange={(e) => setSelectedArticle({ ...selectedArticle, slug: e.target.value })}
                  placeholder="article-slug"
                  className="w-full px-4 py-2 rounded-lg text-sm font-mono focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-secondary)"
                  }}
                />
              </div>

              {/* Excerpt */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Excerpt
                </label>
                <textarea
                  value={selectedArticle.excerpt}
                  onChange={(e) => setSelectedArticle({ ...selectedArticle, excerpt: e.target.value })}
                  placeholder="Brief description of the article..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              {/* Meta Row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedArticle.date}
                    onChange={(e) => setSelectedArticle({ ...selectedArticle, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={selectedArticle.readTime}
                    onChange={(e) => setSelectedArticle({ ...selectedArticle, readTime: e.target.value })}
                    placeholder="5 min"
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Featured
                  </label>
                  <button
                    onClick={() => setSelectedArticle({ ...selectedArticle, featured: !selectedArticle.featured })}
                    className="w-full px-4 py-2 rounded-lg text-sm transition-all duration-200"
                    style={{ 
                      backgroundColor: selectedArticle.featured ? "var(--accent-gold-dim)" : "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: selectedArticle.featured ? "var(--accent-gold)" : "var(--text-muted)"
                    }}
                  >
                    {selectedArticle.featured ? "★ Featured" : "☆ Not Featured"}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedArticle.tags.map(tag => (
                    <span 
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-secondary)",
                        color: "var(--text-secondary)"
                      }}
                    >
                      {tag}
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:opacity-70"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Content Blocks */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Content
                </label>
                <div className="space-y-3">
                  {selectedArticle.content.map((block, index) => (
                    <div 
                      key={index}
                      className="relative p-4 rounded-lg"
                      style={{ 
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-secondary)"
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="text-xs uppercase tracking-wider"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {block.type}
                        </span>
                        <button
                          onClick={() => handleRemoveContentBlock(index)}
                          className="text-xs hover:opacity-70"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        value={block.text}
                        onChange={(e) => handleUpdateContentBlock(index, e.target.value)}
                        rows={block.type === "paragraph" ? 4 : 2}
                        className="w-full bg-transparent focus:outline-none resize-none"
                        style={{ color: "var(--text-primary)" }}
                        placeholder={`Enter ${block.type} text...`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAddContentBlock("paragraph")}
                    className="px-4 py-2 rounded-lg text-xs"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  >
                    + Paragraph
                  </button>
                  <button
                    onClick={() => handleAddContentBlock("heading")}
                    className="px-4 py-2 rounded-lg text-xs"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  >
                    + Heading
                  </button>
                  <button
                    onClick={() => handleAddContentBlock("quote")}
                    className="px-4 py-2 rounded-lg text-xs"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  >
                    + Quote
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* List Mode */
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <p 
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {articles.length} article{articles.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedArticle({ ...EMPTY_ARTICLE });
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)"
                  }}
                >
                  + Quick Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = "/admin/articles/write"}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  style={{ 
                    backgroundColor: "var(--accent-gold)",
                    color: "var(--bg-primary)"
                  }}
                >
                  <span>✦</span> Focus Writer
                </motion.button>
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-3">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                  style={{ 
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-primary)"
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 
                          className="text-lg font-light"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {article.title}
                        </h3>
                        {article.featured && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ 
                              backgroundColor: "var(--accent-gold-dim)",
                              color: "var(--accent-gold)"
                            }}
                          >
                            featured
                          </span>
                        )}
                      </div>
                      <p 
                        className="text-sm mb-2"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>{article.date}</span>
                        <span>·</span>
                        <span>{article.readTime}</span>
                        <span>·</span>
                        <span className="font-mono">/{article.slug}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedArticle(article);
                          setIsEditing(true);
                        }}
                        className="px-3 py-1 rounded-lg text-xs transition-opacity hover:opacity-70"
                        style={{ 
                          backgroundColor: "var(--bg-primary)",
                          border: "1px solid var(--border-secondary)",
                          color: "var(--text-secondary)"
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => window.location.href = `/admin/articles/write?id=${article.id}`}
                        className="px-3 py-1 rounded-lg text-xs transition-opacity hover:opacity-70"
                        style={{ 
                          backgroundColor: "var(--accent-gold-dim)",
                          border: "1px solid var(--accent-gold)",
                          color: "var(--accent-gold)"
                        }}
                      >
                        ✦ Focus
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(article.id)}
                        className="px-3 py-1 rounded-lg text-xs transition-opacity hover:opacity-70"
                        style={{ 
                          backgroundColor: "var(--bg-primary)",
                          border: "1px solid var(--border-secondary)",
                          color: "#ef4444"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  <AnimatePresence>
                    {showDeleteConfirm === article.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 flex items-center justify-between"
                        style={{ borderTop: "1px solid var(--border-secondary)" }}
                      >
                        <p className="text-sm" style={{ color: "#ef4444" }}>
                          Are you sure you want to delete this article?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-3 py-1 rounded-lg text-xs"
                            style={{ 
                              backgroundColor: "var(--bg-primary)",
                              color: "var(--text-muted)"
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="px-3 py-1 rounded-lg text-xs"
                            style={{ 
                              backgroundColor: "#ef4444",
                              color: "white"
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {articles.length === 0 && (
              <div 
                className="text-center py-16"
                style={{ color: "var(--text-muted)" }}
              >
                <p className="text-4xl mb-4">✎</p>
                <p className="text-sm">No articles yet</p>
                <p className="text-xs mt-1">Create your first article to get started</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
