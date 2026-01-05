"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import Link from "next/link";

interface Contemplation {
  id: number;
  question: string;
  active: boolean;
  featured: boolean;
  order: number;
  answers?: { id: number }[];
}

export default function ContemplationsAdmin() {
  const [contemplations, setContemplations] = useState<Contemplation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    fetchContemplations();
  }, []);

  const fetchContemplations = async () => {
    try {
      const res = await fetch("/api/contemplations");
      if (res.ok) {
        const data = await res.json();
        setContemplations(data);
      }
    } catch (error) {
      console.error("Failed to fetch contemplations:", error);
    } finally {
      setLoading(false);
    }
  };

  const addContemplation = async () => {
    if (!newQuestion.trim()) return;
    
    try {
      const res = await fetch("/api/contemplations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion.trim() }),
      });
      
      if (res.ok) {
        const contemplation = await res.json();
        setContemplations([...contemplations, contemplation]);
        setNewQuestion("");
      }
    } catch (error) {
      console.error("Failed to add contemplation:", error);
    }
  };

  const updateContemplation = async (id: number, updates: Partial<Contemplation>) => {
    try {
      const res = await fetch(`/api/contemplations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setContemplations(contemplations.map(c => c.id === id ? { ...c, ...updated } : c));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to update contemplation:", error);
    }
  };

  const deleteContemplation = async (id: number) => {
    if (!confirm("Delete this contemplation? Answers will be preserved but unlinked.")) return;
    
    try {
      const res = await fetch(`/api/contemplations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setContemplations(contemplations.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete contemplation:", error);
    }
  };

  const handleReorder = async (newOrder: Contemplation[]) => {
    setContemplations(newOrder);
    // Bulk update order
    const updates = newOrder.map((c, i) => ({ id: c.id, order: i }));
    await fetch("/api/contemplations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contemplations: updates }),
    });
  };

  const toggleFeatured = async (contemplation: Contemplation) => {
    // If setting as featured, unfeatured all others first
    if (!contemplation.featured) {
      for (const c of contemplations) {
        if (c.featured) {
          await updateContemplation(c.id, { featured: false });
        }
      }
    }
    await updateContemplation(contemplation.id, { featured: !contemplation.featured });
  };

  const startEdit = (contemplation: Contemplation) => {
    setEditingId(contemplation.id);
    setEditText(contemplation.question);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      updateContemplation(editingId, { question: editText.trim() });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 rounded-full" style={{ borderColor: "#333", borderTopColor: "#c9a227" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.5)" }}>
              ← Back
            </Link>
            <h1 className="text-lg font-light" style={{ color: "rgba(255,255,255,0.9)" }}>
              Contemplations
            </h1>
          </div>
          <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
            {contemplations.length} questions
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Info */}
        <div className="mb-8 p-4 rounded-lg" style={{ backgroundColor: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            <span style={{ color: "#c9a227" }}>✦</span> Contemplation questions appear on the site for visitors to reflect and answer. 
            Answers become part of the Board of Collective. Set one as <strong>featured</strong> for the hero.
          </p>
        </div>

        {/* Add New */}
        <div className="mb-8 flex gap-3">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addContemplation()}
            placeholder="Add a new contemplation question..."
            className="flex-1 px-4 py-3 rounded-lg text-sm"
            style={{ 
              backgroundColor: "rgba(255,255,255,0.05)", 
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.9)"
            }}
          />
          <button
            onClick={addContemplation}
            className="px-6 py-3 rounded-lg text-sm font-medium transition-all hover:brightness-110"
            style={{ backgroundColor: "#c9a227", color: "#0a0a0a" }}
          >
            Add
          </button>
        </div>

        {/* Contemplations List */}
        <Reorder.Group axis="y" values={contemplations} onReorder={handleReorder} className="space-y-2">
          <AnimatePresence>
            {contemplations.map((contemplation) => (
              <Reorder.Item
                key={contemplation.id}
                value={contemplation}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 rounded-lg cursor-grab active:cursor-grabbing"
                style={{ 
                  backgroundColor: contemplation.featured ? "rgba(201,162,39,0.1)" : "rgba(255,255,255,0.03)", 
                  border: contemplation.featured ? "1px solid rgba(201,162,39,0.3)" : "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="text-lg mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>⋮⋮</div>
                  
                  {/* Toggle Active */}
                  <button
                    onClick={() => updateContemplation(contemplation.id, { active: !contemplation.active })}
                    className="w-5 h-5 mt-1 rounded flex items-center justify-center transition-colors flex-shrink-0"
                    style={{ 
                      backgroundColor: contemplation.active ? "#c9a227" : "transparent",
                      border: `1px solid ${contemplation.active ? "#c9a227" : "rgba(255,255,255,0.2)"}`
                    }}
                  >
                    {contemplation.active && <span className="text-xs" style={{ color: "#0a0a0a" }}>✓</span>}
                  </button>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === contemplation.id ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={saveEdit}
                        autoFocus
                        className="w-full px-2 py-1 rounded text-sm bg-transparent"
                        style={{ 
                          border: "1px solid rgba(201,162,39,0.5)",
                          color: "rgba(255,255,255,0.9)"
                        }}
                      />
                    ) : (
                      <p 
                        className="text-sm cursor-pointer hover:opacity-70 transition-opacity"
                        style={{ 
                          color: contemplation.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                          textDecoration: contemplation.active ? "none" : "line-through"
                        }}
                        onClick={() => startEdit(contemplation)}
                      >
                        {contemplation.question}
                      </p>
                    )}
                    
                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2">
                      {contemplation.featured && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(201,162,39,0.2)", color: "#c9a227" }}>
                          ★ Hero
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {contemplation.answers?.length || 0} answers
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFeatured(contemplation)}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{ 
                        backgroundColor: contemplation.featured ? "rgba(201,162,39,0.2)" : "transparent",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: contemplation.featured ? "#c9a227" : "rgba(255,255,255,0.4)"
                      }}
                      title={contemplation.featured ? "Remove from hero" : "Set as hero"}
                    >
                      {contemplation.featured ? "★" : "☆"}
                    </button>
                    <button
                      onClick={() => deleteContemplation(contemplation.id)}
                      className="text-sm opacity-30 hover:opacity-100 transition-opacity"
                      style={{ color: "#ff6b6b" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {contemplations.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              No contemplation questions yet. Add your first question above.
            </p>
          </div>
        )}

        {/* Preview Featured */}
        {contemplations.find(c => c.featured) && (
          <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              Hero Preview
            </h3>
            <div className="p-8 rounded-lg text-center" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#c9a227" }}>
                Today's Contemplation
              </p>
              <p className="text-2xl font-light italic" style={{ color: "rgba(255,255,255,0.9)" }}>
                "{contemplations.find(c => c.featured)?.question}"
              </p>
            </div>
          </div>
        )}

        {/* Example Questions */}
        <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <h3 className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            Stoic Question Ideas
          </h3>
          <div className="grid gap-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            <p className="cursor-pointer hover:opacity-70" onClick={() => setNewQuestion("What would you do if you knew you could not fail?")}>
              → What would you do if you knew you could not fail?
            </p>
            <p className="cursor-pointer hover:opacity-70" onClick={() => setNewQuestion("What obstacle are you grateful for?")}>
              → What obstacle are you grateful for?
            </p>
            <p className="cursor-pointer hover:opacity-70" onClick={() => setNewQuestion("How do you deal with setbacks?")}>
              → How do you deal with setbacks?
            </p>
            <p className="cursor-pointer hover:opacity-70" onClick={() => setNewQuestion("What brings you peace?")}>
              → What brings you peace?
            </p>
            <p className="cursor-pointer hover:opacity-70" onClick={() => setNewQuestion("What would the best version of yourself do today?")}>
              → What would the best version of yourself do today?
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
