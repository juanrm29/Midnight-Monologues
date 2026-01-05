"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface DashboardStats {
  articles: { total: number; featured: number };
  projects: { total: number; featured: number };
  quotes: { total: number };
  intentions: { total: number };
  contemplations: { total: number; featured: number };
  notes: { total: number };
  pendingAnswers: number;
  profile: { name: string; title: string; bio: string };
  recentArticles: Array<{
    id: number;
    slug: string;
    title: string;
    date: string;
    readTime: string;
    featured?: boolean;
  }>;
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD - Overview & Quick Actions
// "Begin at once to live, and count each separate day as a separate life." - Seneca
// ═══════════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [articlesRes, projectsRes, quotesRes, intentionsRes, contemplationsRes, notesRes, profileRes, pendingRes] = await Promise.all([
        fetch("/api/articles"),
        fetch("/api/projects"),
        fetch("/api/quotes"),
        fetch("/api/intentions"),
        fetch("/api/contemplations"),
        fetch("/api/notes"),
        fetch("/api/profile"),
        fetch("/api/answers?pending=true"),
      ]);

      const articles = articlesRes.ok ? await articlesRes.json() : [];
      const projects = projectsRes.ok ? await projectsRes.json() : [];
      const quotes = quotesRes.ok ? await quotesRes.json() : [];
      const intentions = intentionsRes.ok ? await intentionsRes.json() : [];
      const contemplations = contemplationsRes.ok ? await contemplationsRes.json() : [];
      const notes = notesRes.ok ? await notesRes.json() : [];
      const profile = profileRes.ok ? await profileRes.json() : { name: "User", title: "Developer", bio: "" };
      const pendingAnswers = pendingRes.ok ? await pendingRes.json() : [];

      const recentArticles = articles
        .sort((a: { date: string }, b: { date: string }) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, 3);

      setDashboardStats({
        articles: { 
          total: articles.length, 
          featured: articles.filter((a: { featured: boolean }) => a.featured).length 
        },
        projects: { 
          total: projects.length, 
          featured: projects.filter((p: { featured: boolean }) => p.featured).length 
        },
        quotes: { total: quotes.length },
        intentions: { total: intentions.length },
        contemplations: {
          total: contemplations.length,
          featured: contemplations.filter((c: { featured: boolean }) => c.featured).length
        },
        notes: { total: notes.length },
        pendingAnswers: pendingAnswers.length,
        profile: { name: profile.name, title: profile.title || "Developer", bio: profile.bio || "" },
        recentArticles,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading || !dashboardStats) {
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

  const stats: Array<{ label: string; value: number; icon: string; href: string; featured: number; alert?: boolean }> = [
    { 
      label: "Articles", 
      value: dashboardStats.articles.total, 
      icon: "✎", 
      href: "/admin/articles",
      featured: dashboardStats.articles.featured
    },
    { 
      label: "Projects", 
      value: dashboardStats.projects.total, 
      icon: "⬡", 
      href: "/admin/projects",
      featured: dashboardStats.projects.featured
    },
    { 
      label: "Quotes", 
      value: dashboardStats.quotes.total, 
      icon: "❝", 
      href: "/admin/quotes",
      featured: 0
    },
    { 
      label: "Intentions", 
      value: dashboardStats.intentions?.total || 0, 
      icon: "◐", 
      href: "/admin/intentions",
      featured: 0
    },
    { 
      label: "Contemplations", 
      value: dashboardStats.contemplations?.total || 0, 
      icon: "◇", 
      href: "/admin/contemplations",
      featured: dashboardStats.contemplations?.featured || 0
    },
    { 
      label: "Collective Notes", 
      value: dashboardStats.notes.total, 
      icon: "▣", 
      href: "/admin/collective",
      featured: 0
    },
    { 
      label: "Pending Answers", 
      value: dashboardStats.pendingAnswers || 0, 
      icon: "⚠", 
      href: "/admin/answers",
      featured: 0,
      alert: (dashboardStats.pendingAnswers || 0) > 0
    },
  ];

  const quickActions = [
    { label: "New Article", href: "/admin/articles?new=true", icon: "+" },
    { label: "New Project", href: "/admin/projects?new=true", icon: "+" },
    { label: "Add Quote", href: "/admin/quotes?new=true", icon: "+" },
    { label: "Add Intention", href: "/admin/intentions", icon: "+" },
    { label: "Add Contemplation", href: "/admin/contemplations", icon: "+" },
    { label: "Edit Profile", href: "/admin/profile", icon: "→" },
  ];

  const recentArticles = dashboardStats.recentArticles;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl"
        style={{ 
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)"
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 
              className="text-2xl font-light mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Welcome back, {dashboardStats.profile.name.split(" ")[0]}
            </h1>
            <p 
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              &ldquo;Begin at once to live, and count each separate day as a separate life.&rdquo; — Seneca
            </p>
          </div>
          <div 
            className="text-right text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <p>Last updated</p>
            <p style={{ color: "var(--text-secondary)" }}>
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href}>
              <div 
                className="p-6 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer group relative"
                style={{ 
                  backgroundColor: stat.alert ? "rgba(239,68,68,0.1)" : "var(--bg-elevated)",
                  border: stat.alert ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border-primary)"
                }}
              >
                {/* Alert pulse */}
                {stat.alert && (
                  <motion.div
                    className="absolute top-3 right-3 w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#ef4444" }}
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <div className="flex items-center justify-between mb-4">
                  <span 
                    className="text-2xl"
                    style={{ color: stat.alert ? "#ef4444" : "var(--accent-gold)" }}
                  >
                    {stat.icon}
                  </span>
                  <span 
                    className="text-xs px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: stat.alert ? "rgba(239,68,68,0.2)" : "var(--bg-primary)",
                      color: stat.alert ? "#ef4444" : "var(--text-muted)"
                    }}
                  >
                    {stat.alert ? "Needs review" : stat.featured > 0 ? `${stat.featured} featured` : "View all"}
                  </span>
                </div>
                <p 
                  className="text-3xl font-light mb-1 group-hover:opacity-70 transition-opacity"
                  style={{ color: stat.alert ? "#ef4444" : "var(--text-primary)" }}
                >
                  {stat.value}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: stat.alert ? "rgba(239,68,68,0.7)" : "var(--text-muted)" }}
                >
                  {stat.label}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl"
          style={{ 
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)"
          }}
        >
          <h2 
            className="text-lg font-light mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-lg text-center cursor-pointer transition-all duration-200"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)"
                  }}
                >
                  <span 
                    className="text-lg block mb-1"
                    style={{ color: "var(--accent-gold)" }}
                  >
                    {action.icon}
                  </span>
                  <span 
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {action.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-xl"
          style={{ 
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)"
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-lg font-light"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Articles
            </h2>
            <Link 
              href="/admin/articles"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--accent-gold)" }}
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentArticles.map((article) => (
              <Link key={article.id} href={`/admin/articles?edit=${article.id}`}>
                <div 
                  className="p-3 rounded-lg transition-all duration-200 hover:opacity-70 cursor-pointer"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)"
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p 
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {article.title}
                      </p>
                      <p 
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {article.date} · {article.readTime}
                      </p>
                    </div>
                    {article.featured && (
                      <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: "var(--accent-gold-dim)",
                          color: "var(--accent-gold)"
                        }}
                      >
                        featured
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Profile Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-xl"
        style={{ 
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)"
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-lg font-light"
            style={{ color: "var(--text-primary)" }}
          >
            Profile Overview
          </h2>
          <Link 
            href="/admin/profile"
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: "var(--accent-gold)" }}
          >
            Edit profile →
          </Link>
        </div>
        <div className="flex items-start gap-6">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{ 
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-secondary)"
            }}
          >
            👤
          </div>
          <div className="flex-1">
            <h3 
              className="text-xl font-light mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {dashboardStats.profile.name}
            </h3>
            <p 
              className="text-sm mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {dashboardStats.profile.title}
            </p>
            <p 
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              {dashboardStats.profile.bio}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
