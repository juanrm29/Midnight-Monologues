"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import Link from "next/link";

interface Intention {
  id: number;
  text: string;
  active: boolean;
  order: number;
}

export default function IntentionsAdmin() {
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIntention, setNewIntention] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    fetchIntentions();
  }, []);

  const fetchIntentions = async () => {
    try {
      const res = await fetch("/api/intentions");
      if (res.ok) {
        const data = await res.json();
        setIntentions(data);
      }
    } catch (error) {
      console.error("Failed to fetch intentions:", error);
    } finally {
      setLoading(false);
    }
  };

  const addIntention = async () => {
    if (!newIntention.trim()) return;
    
    try {
      const res = await fetch("/api/intentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newIntention.trim() }),
      });
      
      if (res.ok) {
        const intention = await res.json();
        setIntentions([...intentions, intention]);
        setNewIntention("");
      }
    } catch (error) {
      console.error("Failed to add intention:", error);
    }
  };

  const updateIntention = async (id: number, updates: Partial<Intention>) => {
    try {
      const res = await fetch(`/api/intentions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setIntentions(intentions.map(i => i.id === id ? updated : i));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to update intention:", error);
    }
  };

  const deleteIntention = async (id: number) => {
    if (!confirm("Delete this intention?")) return;
    
    try {
      const res = await fetch(`/api/intentions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIntentions(intentions.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete intention:", error);
    }
  };

  const handleReorder = async (newOrder: Intention[]) => {
    setIntentions(newOrder);
    // Update order in database
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].order !== i) {
        await fetch(`/api/intentions/${newOrder[i].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newOrder[i], order: i }),
        });
      }
    }
  };

  const startEdit = (intention: Intention) => {
    setEditingId(intention.id);
    setEditText(intention.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      updateIntention(editingId, { text: editText.trim() });
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
              Daily Intentions
            </h1>
          </div>
          <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
            {intentions.length} intentions
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Info */}
        <div className="mb-8 p-4 rounded-lg" style={{ backgroundColor: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            <span style={{ color: "#c9a227" }}>✦</span> Daily intentions rotate based on the current date. 
            One intention is shown per day. Drag to reorder.
          </p>
        </div>

        {/* Add New */}
        <div className="mb-8 flex gap-3">
          <input
            type="text"
            value={newIntention}
            onChange={(e) => setNewIntention(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIntention()}
            placeholder="Add a new daily intention..."
            className="flex-1 px-4 py-3 rounded-lg text-sm"
            style={{ 
              backgroundColor: "rgba(255,255,255,0.05)", 
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.9)"
            }}
          />
          <button
            onClick={addIntention}
            className="px-6 py-3 rounded-lg text-sm font-medium transition-all hover:brightness-110"
            style={{ backgroundColor: "#c9a227", color: "#0a0a0a" }}
          >
            Add
          </button>
        </div>

        {/* Intentions List */}
        <Reorder.Group axis="y" values={intentions} onReorder={handleReorder} className="space-y-2">
          <AnimatePresence>
            {intentions.map((intention) => (
              <Reorder.Item
                key={intention.id}
                value={intention}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 rounded-lg cursor-grab active:cursor-grabbing"
                style={{ 
                  backgroundColor: "rgba(255,255,255,0.03)", 
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="text-lg" style={{ color: "rgba(255,255,255,0.2)" }}>⋮⋮</div>
                  
                  {/* Toggle Active */}
                  <button
                    onClick={() => updateIntention(intention.id, { active: !intention.active })}
                    className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                    style={{ 
                      backgroundColor: intention.active ? "#c9a227" : "transparent",
                      border: `1px solid ${intention.active ? "#c9a227" : "rgba(255,255,255,0.2)"}`
                    }}
                  >
                    {intention.active && <span className="text-xs" style={{ color: "#0a0a0a" }}>✓</span>}
                  </button>
                  
                  {/* Text */}
                  <div className="flex-1">
                    {editingId === intention.id ? (
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
                          color: intention.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                          textDecoration: intention.active ? "none" : "line-through"
                        }}
                        onClick={() => startEdit(intention)}
                      >
                        &ldquo;{intention.text}&rdquo;
                      </p>
                    )}
                  </div>
                  
                  {/* Delete */}
                  <button
                    onClick={() => deleteIntention(intention.id)}
                    className="text-sm opacity-30 hover:opacity-100 transition-opacity"
                    style={{ color: "#ff6b6b" }}
                  >
                    ✕
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {intentions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              No intentions yet. Add your first daily intention above.
            </p>
          </div>
        )}

        {/* Preview */}
        {intentions.length > 0 && (
          <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              Today&apos;s Intention Preview
            </h3>
            <div className="p-6 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
              <p className="text-lg font-light italic" style={{ color: "rgba(255,255,255,0.8)" }}>
                &ldquo;{intentions[new Date().getDate() % intentions.length]?.text}&rdquo;
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
