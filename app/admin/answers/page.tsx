"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Answer {
  id: number;
  question: string;
  answer: string;
  author: string;
  color: string;
  approved: boolean;
  createdAt: string;
  contemplation?: { question: string } | null;
}

// Color mapping for preview
const stickyColors: Record<string, string> = {
  gold: "#fef3c7",
  sage: "#d1fae5",
  stone: "#e7e5e4",
  amber: "#fed7aa",
  bronze: "#fde68a",
};

export default function AnswersModeration() {
  const [pendingAnswers, setPendingAnswers] = useState<Answer[]>([]);
  const [approvedAnswers, setApprovedAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    fetchAnswers();
  }, []);

  const fetchAnswers = async () => {
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch("/api/answers?pending=true"),
        fetch("/api/answers"), // approved only (default)
      ]);
      
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingAnswers(data);
      }
      
      if (approvedRes.ok) {
        const data = await approvedRes.json();
        setApprovedAnswers(data);
      }
    } catch (error) {
      console.error("Failed to fetch answers:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveAnswer = async (id: number) => {
    try {
      const res = await fetch(`/api/answers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        // Move from pending to approved
        setPendingAnswers(pendingAnswers.filter(a => a.id !== id));
        setApprovedAnswers([updated, ...approvedAnswers]);
        setSelectedAnswer(null);
      }
    } catch (error) {
      console.error("Failed to approve answer:", error);
    }
  };

  const rejectAnswer = async (id: number) => {
    if (!confirm("Reject and delete this answer?")) return;
    
    try {
      const res = await fetch(`/api/answers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPendingAnswers(pendingAnswers.filter(a => a.id !== id));
        setSelectedAnswer(null);
      }
    } catch (error) {
      console.error("Failed to reject answer:", error);
    }
  };

  const unapproveAnswer = async (id: number) => {
    try {
      const res = await fetch(`/api/answers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        // Move from approved to pending
        setApprovedAnswers(approvedAnswers.filter(a => a.id !== id));
        setPendingAnswers([updated, ...pendingAnswers]);
      }
    } catch (error) {
      console.error("Failed to unapprove answer:", error);
    }
  };

  const deleteAnswer = async (id: number) => {
    if (!confirm("Permanently delete this answer?")) return;
    
    try {
      const res = await fetch(`/api/answers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApprovedAnswers(approvedAnswers.filter(a => a.id !== id));
        setPendingAnswers(pendingAnswers.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete answer:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 rounded-full" style={{ borderColor: "#333", borderTopColor: "#c9a227" }} />
      </div>
    );
  }

  const currentAnswers = activeTab === "pending" ? pendingAnswers : approvedAnswers;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.5)" }}>
              ← Back
            </Link>
            <h1 className="text-lg font-light" style={{ color: "rgba(255,255,255,0.9)" }}>
              Answer Moderation
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {pendingAnswers.length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium" 
                style={{ backgroundColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                {pendingAnswers.length} pending
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("pending")}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: activeTab === "pending" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
              color: activeTab === "pending" ? "#ef4444" : "rgba(255,255,255,0.6)",
              border: `1px solid ${activeTab === "pending" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            Pending Review ({pendingAnswers.length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: activeTab === "approved" ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
              color: activeTab === "approved" ? "#22c55e" : "rgba(255,255,255,0.6)",
              border: `1px solid ${activeTab === "approved" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            Approved ({approvedAnswers.length})
          </button>
        </div>

        {/* Info */}
        {activeTab === "pending" && pendingAnswers.length > 0 && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              <span style={{ color: "#ef4444" }}>⚠</span> Review these answers before they appear on the Board of Collective.
            </p>
          </div>
        )}

        {/* Answers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {currentAnswers.map((answer) => (
              <motion.div
                key={answer.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative rounded-lg overflow-hidden cursor-pointer group"
                style={{ backgroundColor: stickyColors[answer.color] || stickyColors.gold }}
                onClick={() => setSelectedAnswer(answer)}
              >
                {/* Status Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span 
                    className="px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      backgroundColor: answer.approved ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                      color: answer.approved ? "#166534" : "#991b1b",
                    }}
                  >
                    {answer.approved ? "Approved" : "Pending"}
                  </span>
                </div>

                <div className="p-5">
                  {/* Question */}
                  <p className="text-[10px] uppercase tracking-wider mb-2 font-medium line-clamp-1"
                    style={{ color: "rgba(0,0,0,0.4)" }}>
                    {answer.question}
                  </p>

                  {/* Answer */}
                  <p className="text-sm leading-relaxed mb-3 italic line-clamp-4"
                    style={{ color: "rgba(0,0,0,0.75)", fontFamily: "'Georgia', serif" }}>
                    &ldquo;{answer.answer}&rdquo;
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
                    <span className="text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                      — {answer.author}
                    </span>
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                      {formatDate(answer.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Quick Actions on Hover */}
                {activeTab === "pending" && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); approveAnswer(answer.id); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: "#22c55e", color: "#fff" }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); rejectAnswer(answer.id); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: "#ef4444", color: "#fff" }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {currentAnswers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">
              {activeTab === "pending" ? "✓" : "📭"}
            </p>
            <p className="text-lg font-light" style={{ color: "rgba(255,255,255,0.5)" }}>
              {activeTab === "pending" 
                ? "No pending answers to review" 
                : "No approved answers yet"}
            </p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAnswer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedAnswer(null)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full z-10 rounded-xl overflow-hidden"
              style={{ backgroundColor: stickyColors[selectedAnswer.color] || stickyColors.gold }}
            >
              <div className="p-8">
                {/* Question */}
                <p className="text-xs uppercase tracking-wider mb-4 font-medium"
                  style={{ color: "rgba(0,0,0,0.5)" }}>
                  {selectedAnswer.question}
                </p>

                {/* Answer */}
                <p className="text-xl leading-relaxed mb-6 italic"
                  style={{ color: "rgba(0,0,0,0.85)", fontFamily: "'Georgia', serif" }}>
                  &ldquo;{selectedAnswer.answer}&rdquo;
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between pt-4 border-t mb-6" style={{ borderColor: "rgba(0,0,0,0.15)" }}>
                  <span className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
                    — {selectedAnswer.author}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                    {formatDate(selectedAnswer.createdAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {!selectedAnswer.approved ? (
                    <>
                      <button
                        onClick={() => approveAnswer(selectedAnswer.id)}
                        className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
                        style={{ backgroundColor: "#22c55e", color: "#fff" }}
                      >
                        ✓ Approve & Publish
                      </button>
                      <button
                        onClick={() => rejectAnswer(selectedAnswer.id)}
                        className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
                        style={{ backgroundColor: "#ef4444", color: "#fff" }}
                      >
                        ✕ Reject & Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => unapproveAnswer(selectedAnswer.id)}
                        className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
                        style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "rgba(0,0,0,0.7)" }}
                      >
                        Unapprove
                      </button>
                      <button
                        onClick={() => deleteAnswer(selectedAnswer.id)}
                        className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
                        style={{ backgroundColor: "#ef4444", color: "#fff" }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
