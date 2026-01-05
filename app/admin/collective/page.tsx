"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface StickyNote {
  id: number;
  question: string;
  answer: string;
  author: string;
  color: "gold" | "sage" | "marble" | "bronze";
  position: { x: number; y: number };
  rotation: number;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// COLLECTIVE NOTES MANAGER - CRUD for community sticky notes
// "We are all fellow passengers on the same planet" - Marcus Aurelius
// ═══════════════════════════════════════════════════════════════════

const EMPTY_NOTE: StickyNote = {
  id: 0,
  question: "",
  answer: "",
  author: "",
  color: "gold",
  position: { x: 20, y: 20 },
  rotation: 0,
  createdAt: new Date().toISOString().split("T")[0]
};

const COLORS: StickyNote["color"][] = ["gold", "sage", "marble", "bronze"];

const COLOR_STYLES: Record<StickyNote["color"], { bg: string; text: string }> = {
  gold: { bg: "rgba(201, 162, 39, 0.15)", text: "var(--accent-gold)" },
  sage: { bg: "rgba(107, 142, 35, 0.15)", text: "#6b8e23" },
  marble: { bg: "rgba(200, 200, 200, 0.15)", text: "var(--text-secondary)" },
  bronze: { bg: "rgba(205, 127, 50, 0.15)", text: "#cd7f32" }
};

export default function CollectiveManager() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<StickyNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    setSaving(true);
    
    try {
      const isNew = selectedNote.id === 0;
      const url = isNew ? "/api/notes" : `/api/notes/${selectedNote.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedNote),
      });
      
      if (res.ok) {
        await loadNotes();
        setIsEditing(false);
        setSelectedNote(null);
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadNotes();
        setShowDeleteConfirm(null);
        if (selectedNote?.id === id) {
          setSelectedNote(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
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
        {isEditing && selectedNote ? (
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
                  setSelectedNote(null);
                }}
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                ← Back to notes
              </button>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedNote(null);
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
                  Save Note
                </motion.button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Editor Form */}
              <div 
                className="p-6 rounded-xl space-y-6"
                style={{ 
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-primary)"
                }}
              >
                {/* Question */}
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Question
                  </label>
                  <input
                    type="text"
                    value={selectedNote.question}
                    onChange={(e) => setSelectedNote({ ...selectedNote, question: e.target.value })}
                    placeholder="What question was asked?"
                    className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>

                {/* Answer */}
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Answer
                  </label>
                  <textarea
                    value={selectedNote.answer}
                    onChange={(e) => setSelectedNote({ ...selectedNote, answer: e.target.value })}
                    placeholder="The wisdom shared..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>

                {/* Author */}
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Author
                  </label>
                  <input
                    type="text"
                    value={selectedNote.author}
                    onChange={(e) => setSelectedNote({ ...selectedNote, author: e.target.value })}
                    placeholder="Anonymous Stoic"
                    className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>

                {/* Color */}
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Color
                  </label>
                  <div className="flex gap-3">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedNote({ ...selectedNote, color })}
                        className={`w-12 h-12 rounded-lg transition-all duration-200 ${
                          selectedNote.color === color ? "ring-2 ring-offset-2" : ""
                        }`}
                        style={{ 
                          backgroundColor: COLOR_STYLES[color].bg,
                          borderColor: COLOR_STYLES[color].text,
                          border: "2px solid",
                          // @ts-expect-error CSS custom property
                          "--tw-ring-color": COLOR_STYLES[color].text,
                          "--tw-ring-offset-color": "var(--bg-elevated)"
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Position & Rotation */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label 
                      className="block text-xs uppercase tracking-wider mb-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Position X (%)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="70"
                      value={selectedNote.position.x}
                      onChange={(e) => setSelectedNote({ 
                        ...selectedNote, 
                        position: { ...selectedNote.position, x: parseInt(e.target.value) || 20 }
                      })}
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
                      Position Y (%)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="70"
                      value={selectedNote.position.y}
                      onChange={(e) => setSelectedNote({ 
                        ...selectedNote, 
                        position: { ...selectedNote.position, y: parseInt(e.target.value) || 20 }
                      })}
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
                      Rotation (°)
                    </label>
                    <input
                      type="number"
                      min="-15"
                      max="15"
                      value={selectedNote.rotation}
                      onChange={(e) => setSelectedNote({ 
                        ...selectedNote, 
                        rotation: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-secondary)",
                        color: "var(--text-secondary)"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div 
                className="p-6 rounded-xl relative min-h-[400px]"
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
                
                {/* Simulated sticky note */}
                <div
                  className="absolute p-4 rounded-lg shadow-lg max-w-[200px]"
                  style={{
                    left: `${selectedNote.position.x}%`,
                    top: `${selectedNote.position.y + 10}%`,
                    backgroundColor: COLOR_STYLES[selectedNote.color].bg,
                    border: `1px solid ${COLOR_STYLES[selectedNote.color].text}`,
                    transform: `rotate(${selectedNote.rotation}deg)`
                  }}
                >
                  <p 
                    className="text-xs font-medium mb-2"
                    style={{ color: COLOR_STYLES[selectedNote.color].text }}
                  >
                    {selectedNote.question || "Question?"}
                  </p>
                  <p 
                    className="text-sm leading-relaxed mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedNote.answer || "Answer will appear here..."}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    — {selectedNote.author || "Author"}
                  </p>
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
                {notes.length} note{notes.length !== 1 ? "s" : ""} from the collective
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedNote({ 
                    ...EMPTY_NOTE,
                    position: { 
                      x: Math.floor(Math.random() * 50) + 10,
                      y: Math.floor(Math.random() * 50) + 10
                    },
                    rotation: Math.floor(Math.random() * 10) - 5
                  });
                  setIsEditing(true);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ 
                  backgroundColor: "var(--accent-gold)",
                  color: "var(--bg-primary)"
                }}
              >
                + New Note
              </motion.button>
            </div>

            {/* Notes Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                  style={{ 
                    backgroundColor: COLOR_STYLES[note.color].bg,
                    border: `1px solid ${COLOR_STYLES[note.color].text}`
                  }}
                >
                  <p 
                    className="text-xs font-medium mb-2"
                    style={{ color: COLOR_STYLES[note.color].text }}
                  >
                    {note.question}
                  </p>
                  <p 
                    className="text-sm leading-relaxed mb-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {note.answer}
                  </p>
                  <div className="flex items-center justify-between">
                    <p 
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      — {note.author}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {note.createdAt}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div 
                    className="mt-4 pt-4 flex gap-2"
                    style={{ borderTop: `1px solid ${COLOR_STYLES[note.color].text}40` }}
                  >
                    <button
                      onClick={() => {
                        setSelectedNote(note);
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
                      onClick={() => setShowDeleteConfirm(note.id)}
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
                    {showDeleteConfirm === note.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 flex items-center justify-between"
                        style={{ borderTop: `1px solid ${COLOR_STYLES[note.color].text}40` }}
                      >
                        <p className="text-xs" style={{ color: "#ef4444" }}>
                          Delete?
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
                            onClick={() => handleDelete(note.id)}
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

            {notes.length === 0 && (
              <div 
                className="text-center py-16"
                style={{ color: "var(--text-muted)" }}
              >
                <p className="text-4xl mb-4">▣</p>
                <p className="text-sm">No collective notes yet</p>
                <p className="text-xs mt-1">Add wisdom from the community</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
