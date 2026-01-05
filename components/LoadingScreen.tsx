"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"breathe" | "quote" | "expand" | "fade">("breathe");
  
  // Stoic greeting based on time
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Begin the day with purpose.";
    if (hour >= 12 && hour < 17) return "The present moment is all we have.";
    if (hour >= 17 && hour < 21) return "Reflect on what you've learned today.";
    return "The stars witness your contemplation.";
  };

  useEffect(() => {
    // Breathing phase
    const timer1 = setTimeout(() => setPhase("quote"), 1500);
    // Show quote
    const timer2 = setTimeout(() => setPhase("expand"), 3200);
    // Expand and fade
    const timer3 = setTimeout(() => setPhase("fade"), 3800);
    // Complete
    const timer4 = setTimeout(() => onComplete(), 4400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary, #050505)' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "fade" ? 0 : 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Ensō Circle with golden accent */}
      <div className="relative flex flex-col items-center">
        {/* The breathing circle */}
        <motion.div
          className="relative"
          animate={{
            scale: phase === "breathe" ? [1, 1.1, 1] : phase === "expand" || phase === "fade" ? 50 : 1,
          }}
          transition={{
            duration: phase === "breathe" ? 2 : 0.6,
            repeat: phase === "breathe" ? Infinity : 0,
            ease: phase === "breathe" ? "easeInOut" : [0.22, 1, 0.36, 1],
          }}
        >
          {/* Outer ring - Ensō inspired with gold */}
          <motion.svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            className="overflow-visible"
          >
            <motion.circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: phase === "breathe" || phase === "quote" ? 0.85 : 1,
                opacity: phase === "fade" ? 0 : 0.6,
              }}
              transition={{ 
                pathLength: { duration: 1.5, ease: "easeOut" },
                opacity: { duration: 0.3 }
              }}
              style={{
                rotate: "-90deg",
                transformOrigin: "center",
                color: 'var(--accent-gold, #c9a227)',
              }}
            />
          </motion.svg>
          
          {/* Inner dot - the seed */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: phase === "fade" || phase === "expand" ? 0 : 1,
              scale: phase === "breathe" ? [0.8, 1, 0.8] : phase === "quote" ? 1 : 0,
            }}
            transition={{
              opacity: { duration: 0.3, delay: 0.5 },
              scale: { duration: 2, repeat: phase === "breathe" ? Infinity : 0, ease: "easeInOut" }
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--accent-gold, #c9a227)', opacity: 0.6 }}
            />
          </motion.div>
        </motion.div>
        
        {/* Quote and text below */}
        <motion.div
          className="mt-8 sm:mt-12 text-center max-w-sm px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: phase === "fade" || phase === "expand" ? 0 : phase === "quote" ? 1 : 0,
            y: phase === "fade" || phase === "expand" ? -20 : 0,
          }}
          transition={{ duration: 0.8, delay: phase === "quote" ? 0 : 0.8 }}
        >
          {phase === "breathe" && (
            <motion.p 
              className="text-[9px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.5em] uppercase"
              style={{ color: 'var(--text-muted, #454545)' }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              breathe
            </motion.p>
          )}
          {phase === "quote" && (
            <motion.p 
              className="text-sm sm:text-base font-light italic"
              style={{ color: 'var(--text-secondary, #a8a8a8)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {getTimeGreeting()}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Signature - bottom */}
      <motion.p
        className="absolute bottom-6 sm:bottom-8 text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.3em]"
        style={{ color: 'var(--text-muted, #454545)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "fade" ? 0 : 0.5 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        memento vivere
      </motion.p>
    </motion.div>
  );
}
