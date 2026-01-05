"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Profile {
  name: string;
  title: string;
  bio: string;
  avatar?: string;
  location?: string;
  email?: string;
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// PROFILE EDITOR - Personal information management
// "Know thyself" - Oracle at Delphi
// ═══════════════════════════════════════════════════════════════════

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading || !profile) {
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p 
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Your personal information displayed across the site
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ 
            backgroundColor: saved ? "#22c55e" : "var(--accent-gold)",
            color: "var(--bg-primary)"
          }}
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Profile"}
        </motion.button>
      </div>

      {/* Profile Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl"
        style={{ 
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)"
        }}
      >
        <div className="flex items-start gap-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
            style={{ 
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-secondary)"
            }}
          >
            👤
          </div>
          <div className="flex-1">
            <h2 
              className="text-2xl font-light mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {profile.name || "Your Name"}
            </h2>
            <p 
              className="text-sm mb-3"
              style={{ color: "var(--accent-gold)" }}
            >
              {profile.title || "Your Title"}
            </p>
            <p 
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {profile.bio || "Your bio will appear here..."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Basic Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl space-y-6"
        style={{ 
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)"
        }}
      >
        <h3 
          className="text-lg font-light"
          style={{ color: "var(--text-primary)" }}
        >
          Basic Information
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label 
              className="block text-xs uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Juan Rizky Maulana"
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
              Title
            </label>
            <input
              type="text"
              value={profile.title}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              placeholder="Developer & Stoic Practitioner"
              className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-primary)"
              }}
            />
          </div>
        </div>

        <div>
          <label 
            className="block text-xs uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Bio
          </label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Brief description about yourself..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ 
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-secondary)",
              color: "var(--text-primary)"
            }}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label 
              className="block text-xs uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Location
            </label>
            <input
              type="text"
              value={profile.location || ""}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              placeholder="Indonesia"
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
              Email
            </label>
            <input
              type="email"
              value={profile.email || ""}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="hello@example.com"
              className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-primary)"
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-xl space-y-6"
        style={{ 
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)"
        }}
      >
        <h3 
          className="text-lg font-light"
          style={{ color: "var(--text-primary)" }}
        >
          Social Links
        </h3>

        <div className="space-y-4">
          <div>
            <label 
              className="block text-xs uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              GitHub
            </label>
            <input
              type="url"
              value={profile.social?.github || ""}
              onChange={(e) => setProfile({ 
                ...profile, 
                social: { ...profile.social, github: e.target.value }
              })}
              placeholder="https://github.com/username"
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
              Twitter / X
            </label>
            <input
              type="url"
              value={profile.social?.twitter || ""}
              onChange={(e) => setProfile({ 
                ...profile, 
                social: { ...profile.social, twitter: e.target.value }
              })}
              placeholder="https://twitter.com/username"
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
              LinkedIn
            </label>
            <input
              type="url"
              value={profile.social?.linkedin || ""}
              onChange={(e) => setProfile({ 
                ...profile, 
                social: { ...profile.social, linkedin: e.target.value }
              })}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-primary)"
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl text-center"
        style={{ 
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)"
        }}
      >
        <p 
          className="text-sm italic"
          style={{ color: "var(--text-secondary)" }}
        >
          &ldquo;He is a wise man who does not grieve for the things which he has not, 
          but rejoices for those which he has.&rdquo;
        </p>
        <p 
          className="text-xs mt-2"
          style={{ color: "var(--text-muted)" }}
        >
          — Epictetus
        </p>
      </motion.div>
    </div>
  );
}
