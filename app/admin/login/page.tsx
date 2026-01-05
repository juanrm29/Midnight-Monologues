"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

// ═══════════════════════════════════════════════════════════════════
// ADMIN LOGIN - "The first step to wisdom is silence"
// ═══════════════════════════════════════════════════════════════════

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate slight delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (login(password)) {
      router.push("/admin");
    } else {
      setError("Invalid password. Try again.");
      setPassword("");
    }
    setIsLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Background Pattern */}
      <div 
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--text-muted) 1px, transparent 0)`,
          backgroundSize: "40px 40px"
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
            style={{ 
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-primary)"
            }}
          >
            <span className="text-2xl">🏛️</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-light tracking-wide mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Sanctum
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Content Management Portal
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onSubmit={handleSubmit}
          className="p-8 rounded-xl"
          style={{ 
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)"
          }}
        >
          {/* Quote */}
          <div className="mb-8 text-center">
            <p 
              className="text-sm italic leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              &ldquo;Know thyself&rdquo;
            </p>
            <p 
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              — Oracle at Delphi
            </p>
          </div>

          {/* Password Input */}
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="password"
                className="block text-xs uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the sanctum..."
                className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-secondary)",
                  color: "var(--text-primary)",
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": "var(--accent-gold)"
                }}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-center"
                style={{ color: "#ef4444" }}
              >
                {error}
              </motion.p>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !password}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50"
              style={{ 
                backgroundColor: "var(--accent-gold)",
                color: "var(--bg-primary)"
              }}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ◐
                  </motion.span>
                  Entering...
                </span>
              ) : (
                "Enter Sanctum"
              )}
            </motion.button>
          </div>

          {/* Hint */}
          <p 
            className="mt-6 text-xs text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Default: stoic2025
          </p>
        </motion.form>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
          <a 
            href="/"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            ← Return to site
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
