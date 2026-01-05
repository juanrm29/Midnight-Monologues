"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Quote {
  id: number;
  text: string;
  author: string;
  source: string;
  category?: string;
}

// ═══════════════════════════════════════════════════════════════════
// QUOTES MANAGER - CRUD for Stoic quotes
// "The soul becomes dyed with the color of its thoughts." - Marcus Aurelius
// ═══════════════════════════════════════════════════════════════════

const EMPTY_QUOTE: Quote = {
  id: 0,
  text: "",
  author: "",
  source: "",
  category: ""
};

const CATEGORIES = [
  "control", "death", "virtue", "wisdom", "action", "anxiety", 
  "perception", "nature", "obstacles", "gratitude", "time"
];

export default function QuotesManager() {
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadQuotes();
  }, []);

  useEffect(() => {
    if (mounted && searchParams.get("new")) {
      setSelectedQuote({ ...EMPTY_QUOTE });
      setIsEditing(true);
    }
  }, [mounted, searchParams]);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quotes");
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch (error) {
      console.error("Failed to load quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedQuote) return;
    setSaving(true);
    
    try {
      const isNew = selectedQuote.id === 0;
      const url = isNew ? "/api/quotes" : `/api/quotes/${selectedQuote.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedQuote),
      });
      
      if (res.ok) {
        await loadQuotes();
        setIsEditing(false);
        setSelectedQuote(null);
      }
    } catch (error) {
      console.error("Failed to save quote:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadQuotes();
        setShowDeleteConfirm(null);
        if (selectedQuote?.id === id) {
          setSelectedQuote(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Failed to delete quote:", error);
    }
  };

  const filteredQuotes = filterCategory 
    ? quotes.filter(q => q.category === filterCategory)
    : quotes;

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
        {isEditing && selectedQuote ? (
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
                  setSelectedQuote(null);
                }}
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                ← Back to quotes
              </button>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedQuote(null);
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
                  Save Quote
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
              {/* Quote Text */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Quote
                </label>
                <textarea
                  value={selectedQuote.text}
                  onChange={(e) => setSelectedQuote({ ...selectedQuote, text: e.target.value })}
                  placeholder="Enter the quote text..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg text-lg font-light italic focus:outline-none focus:ring-2 resize-none"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              {/* Author & Source */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Author
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.author}
                    onChange={(e) => setSelectedQuote({ ...selectedQuote, author: e.target.value })}
                    placeholder="Marcus Aurelius"
                    className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Source
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.source}
                    onChange={(e) => setSelectedQuote({ ...selectedQuote, source: e.target.value })}
                    placeholder="Meditations V.20"
                    className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Category
                </label>
                <select
                  value={selectedQuote.category || ""}
                  onChange={(e) => setSelectedQuote({ ...selectedQuote, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-primary)"
                  }}
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div 
                className="p-6 rounded-lg text-center"
                style={{ 
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-secondary)"
                }}
              >
                <p 
                  className="text-xs uppercase tracking-wider mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Preview
                </p>
                <p 
                  className="text-lg italic leading-relaxed mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  &ldquo;{selectedQuote.text || "Your quote here..."}&rdquo;
                </p>
                <p 
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  — {selectedQuote.author || "Author"}{selectedQuote.source ? `, ${selectedQuote.source}` : ""}
                </p>
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <p 
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? "s" : ""}
                </p>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1 rounded-lg text-xs"
                  style={{ 
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)"
                  }}
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedQuote({ ...EMPTY_QUOTE });
                  setIsEditing(true);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ 
                  backgroundColor: "var(--accent-gold)",
                  color: "var(--bg-primary)"
                }}
              >
                + New Quote
              </motion.button>
            </div>

            {/* Quotes Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredQuotes.map((quote, index) => (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                  style={{ 
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-primary)"
                  }}
                >
                  <p 
                    className="text-sm italic leading-relaxed mb-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p 
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        — {quote.author}
                      </p>
                      <p 
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {quote.source}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {quote.category && (
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-muted)"
                          }}
                        >
                          {quote.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div 
                    className="mt-4 pt-4 flex gap-2"
                    style={{ borderTop: "1px solid var(--border-secondary)" }}
                  >
                    <button
                      onClick={() => {
                        setSelectedQuote(quote);
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
                      onClick={() => setShowDeleteConfirm(quote.id)}
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

                  {/* Delete Confirmation */}
                  <AnimatePresence>
                    {showDeleteConfirm === quote.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 flex items-center justify-between"
                        style={{ borderTop: "1px solid var(--border-secondary)" }}
                      >
                        <p className="text-xs" style={{ color: "#ef4444" }}>
                          Delete this quote?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(quote.id)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: "#ef4444", color: "white" }}
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

            {filteredQuotes.length === 0 && (
              <div 
                className="text-center py-16"
                style={{ color: "var(--text-muted)" }}
              >
                <p className="text-4xl mb-4">❝</p>
                <p className="text-sm">No quotes yet</p>
                <p className="text-xs mt-1">Add your first Stoic wisdom</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
