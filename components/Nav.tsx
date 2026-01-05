"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavProps {
  current: string;
  onChange: (view: string) => void;
}

export default function Nav({ current, onChange }: NavProps) {
  const items = ["now", "writing", "work", "collective", "about", "voices"];
  const [currentDate, setCurrentDate] = useState({ day: "", date: "", month: "" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    setCurrentDate({
      day: now.toLocaleDateString('en-US', { weekday: 'short' }),
      date: now.getDate().toString().padStart(2, '0'),
      month: now.toLocaleDateString('en-US', { month: 'short' }),
    });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < items.length) {
        onChange(items[idx]);
        setMobileMenuOpen(false);
      }
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onChange, items]);

  // Close mobile menu when view changes
  const handleNavChange = (view: string) => {
    onChange(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm md:backdrop-blur-none"
        style={{ backgroundColor: 'var(--bg-primary)', opacity: 0.95 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="h-14 sm:h-16 md:h-20 flex items-center justify-between">
            {/* Logo + Date */}
            <motion.div 
              className="flex items-center gap-3 sm:gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span 
                className="text-sm font-medium tracking-[0.15em]"
                style={{ color: 'var(--text-primary)' }}
              >
                JRM
              </span>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>{currentDate.day}</span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span className="text-sm font-light tabular-nums" style={{ color: 'var(--text-secondary)' }}>{currentDate.date}</span>
                <span className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>{currentDate.month}</span>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div 
              className="hidden sm:flex items-center gap-1 md:gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {items.map((item, i) => (
                <button
                  key={item}
                  onClick={() => handleNavChange(item)}
                  className="relative px-3 md:px-4 py-2 text-[10px] md:text-xs tracking-widest uppercase transition-all duration-300 rounded-sm"
                  style={{ 
                    color: current === item ? 'var(--text-primary)' : 'var(--text-tertiary)'
                  }}
                >
                  {/* Active indicator */}
                  {current === item && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-sm"
                      style={{ backgroundColor: 'var(--text-primary)', opacity: 0.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item}</span>
                  
                  {/* Keyboard hint on hover */}
                  <span 
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {i + 1}
                  </span>
                </button>
              ))}
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              className="sm:hidden flex flex-col justify-center items-center w-10 h-10 -mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <motion.span 
                className="block w-5 h-px mb-1.5"
                style={{ backgroundColor: 'var(--text-primary)' }}
                animate={{ 
                  rotate: mobileMenuOpen ? 45 : 0,
                  y: mobileMenuOpen ? 4 : 0
                }}
              />
              <motion.span 
                className="block w-5 h-px"
                style={{ backgroundColor: 'var(--text-primary)' }}
                animate={{ opacity: mobileMenuOpen ? 0 : 1 }}
              />
              <motion.span 
                className="block w-5 h-px mt-1.5"
                style={{ backgroundColor: 'var(--text-primary)' }}
                animate={{ 
                  rotate: mobileMenuOpen ? -45 : 0,
                  y: mobileMenuOpen ? -4 : 0
                }}
              />
            </motion.button>
          </div>
        </div>
        
        {/* Subtle bottom border */}
        <div className="h-px" style={{ background: `linear-gradient(to right, transparent, var(--border-primary), transparent)` }} />
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 backdrop-blur-md sm:hidden"
            style={{ backgroundColor: 'var(--bg-primary)', opacity: 0.98 }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center h-full gap-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Date on mobile menu */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>{currentDate.day}</span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span className="text-sm font-light tabular-nums" style={{ color: 'var(--text-secondary)' }}>{currentDate.date}</span>
                <span className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>{currentDate.month}</span>
              </div>

              {items.map((item, i) => (
                <motion.button
                  key={item}
                  onClick={() => handleNavChange(item)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-2xl tracking-widest uppercase transition-colors py-2"
                  style={{ 
                    color: current === item ? 'var(--text-primary)' : 'var(--text-tertiary)'
                  }}
                >
                  {item}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
