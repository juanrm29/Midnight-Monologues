/* eslint-disable */
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import Nav from "@/components/Nav";
import LoadingScreen from "@/components/LoadingScreen";

// ═══════════════════════════════════════════════════════════════════
// GLOBAL CONTEXTS & STORES
// ═══════════════════════════════════════════════════════════════════

// Sound Manager
const SoundManager = {
  enabled: false,
  volume: 0.3,
  context: null as AudioContext | null,
  
  init() {
    if (typeof window !== 'undefined' && !this.context) {
      this.context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  },
  
  play(type: 'click' | 'hover' | 'type' | 'ambient' | 'success' | 'open' | 'close') {
    if (!this.enabled || !this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    const sounds: Record<string, { freq: number; type: OscillatorType; duration: number }> = {
      click: { freq: 600, type: 'sine', duration: 0.05 },
      hover: { freq: 400, type: 'sine', duration: 0.03 },
      type: { freq: 800, type: 'square', duration: 0.02 },
      success: { freq: 880, type: 'sine', duration: 0.15 },
      open: { freq: 300, type: 'sine', duration: 0.1 },
      close: { freq: 200, type: 'sine', duration: 0.08 },
      ambient: { freq: 60, type: 'sine', duration: 2 },
    };
    
    const sound = sounds[type];
    oscillator.frequency.setValueAtTime(sound.freq, this.context.currentTime);
    oscillator.type = sound.type;
    gainNode.gain.setValueAtTime(this.volume * 0.1, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + sound.duration);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + sound.duration);
  },
  
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.init();
    return this.enabled;
  }
};

// Reading Progress Store (localStorage)
const ReadingProgress = {
  save(articleId: string, progress: number) {
    if (typeof window === 'undefined') return;
    const data = this.getAll();
    data[articleId] = { progress, lastRead: Date.now() };
    localStorage.setItem('reading-progress', JSON.stringify(data));
  },
  
  get(articleId: string): number {
    if (typeof window === 'undefined') return 0;
    const data = this.getAll();
    return data[articleId]?.progress || 0;
  },
  
  getAll(): Record<string, { progress: number; lastRead: number }> {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('reading-progress') || '{}');
    } catch {
      return {};
    }
  },
  
  getLastRead(): string | null {
    const data = this.getAll();
    const entries = Object.entries(data);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1].lastRead - a[1].lastRead)[0][0];
  }
};

// Theme Store
const ThemeStore = {
  get(): 'dark' | 'light' | 'auto' {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('theme') as 'dark' | 'light' | 'auto') || 'dark';
  },
  
  set(theme: 'dark' | 'light' | 'auto') {
    if (typeof window === 'undefined') return;
    localStorage.setItem('theme', theme);
  }
};

// ═══════════════════════════════════════════════════════════════════
// GENIUS HOOKS
// ═══════════════════════════════════════════════════════════════════

// Time awareness - changes atmosphere based on time with Stoic greetings
function useTimeAwareness() {
  const [phase, setPhase] = useState<"dawn" | "day" | "dusk" | "night" | null>(null);
  
  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 8) setPhase("dawn");
    else if (h >= 8 && h < 17) setPhase("day");
    else if (h >= 17 && h < 20) setPhase("dusk");
    else setPhase("night");
  }, []);

  const atmosphere = {
    dawn: { accent: "from-amber-900/20", greeting: "Begin with purpose", mood: "hopeful" },
    day: { accent: "from-white/5", greeting: "Be present in this moment", mood: "focused" },
    dusk: { accent: "from-orange-900/20", greeting: "Reflect on what you've learned", mood: "contemplative" },
    night: { accent: "from-blue-900/20", greeting: "Rest well, prepare for tomorrow", mood: "peaceful" }
  };

  // Default to day during SSR
  const currentPhase = phase || "day";
  return { phase: currentPhase, ...atmosphere[currentPhase] };
}

// Life progress - memento mori
function useLifeProgress() {
  const [data, setData] = useState({ day: 0, year: 0, week: 1, mounted: false });
  
  useEffect(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    
    setData({
      day: ((now.getTime() - startOfDay.getTime()) / (24 * 60 * 60 * 1000)) * 100,
      year: ((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100,
      week: Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)),
      mounted: true
    });
  }, []);
  
  return data;
}

// Session awareness - how long user has been present
function usePresence() {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };
  
  return { seconds, formatted: format(seconds) };
}

// Scroll depth awareness
function useScrollDepth() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });
  return smoothProgress;
}

// Lunar Phase - shows current moon phase
function useLunarPhase() {
  const [phase, setPhase] = useState({ name: "New Moon", emoji: "🌑", illumination: 0, mounted: false });
  
  useEffect(() => {
    // Calculate moon phase based on synodic month (29.53 days)
    const now = new Date();
    
    // Known new moon: January 6, 2000
    const knownNew = new Date(2000, 0, 6).getTime();
    const current = now.getTime();
    const daysSince = (current - knownNew) / (1000 * 60 * 60 * 24);
    const lunarCycle = 29.53;
    const daysIntoCycle = daysSince % lunarCycle;
    const phasePercent = daysIntoCycle / lunarCycle;
    
    const phases = [
      { name: "New Moon", emoji: "🌑", range: [0, 0.0625] },
      { name: "Waxing Crescent", emoji: "🌒", range: [0.0625, 0.1875] },
      { name: "First Quarter", emoji: "🌓", range: [0.1875, 0.3125] },
      { name: "Waxing Gibbous", emoji: "🌔", range: [0.3125, 0.4375] },
      { name: "Full Moon", emoji: "🌕", range: [0.4375, 0.5625] },
      { name: "Waning Gibbous", emoji: "🌖", range: [0.5625, 0.6875] },
      { name: "Last Quarter", emoji: "🌗", range: [0.6875, 0.8125] },
      { name: "Waning Crescent", emoji: "🌘", range: [0.8125, 1] },
    ];
    
    const currentPhase = phases.find(p => phasePercent >= p.range[0] && phasePercent < p.range[1]) || phases[0];
    const illumination = Math.abs(Math.cos(phasePercent * 2 * Math.PI)) * 100;
    
    setPhase({ ...currentPhase, illumination, mounted: true });
  }, []);
  
  return phase;
}

// Mouse parallax effect
function useMouseParallax() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setPosition({ x, y });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);
  
  return position;
}

// Konami Code Easter Egg
function useKonamiCode(callback: () => void) {
  const sequence = useRef<string[]>([]);
  const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      sequence.current.push(e.key);
      sequence.current = sequence.current.slice(-10);
      
      if (sequence.current.join(",") === konamiCode.join(",")) {
        callback();
        sequence.current = [];
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [callback]);
}

// Terminal Easter Egg Hook
function useTerminalTrigger(callback: () => void) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [callback]);
}

// Sound Hook
function useSound() {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    setEnabled(SoundManager.enabled);
  }, []);
  
  const toggle = useCallback(() => {
    const newState = SoundManager.toggle();
    setEnabled(newState);
  }, []);
  
  const play = useCallback((type: 'click' | 'hover' | 'type' | 'ambient' | 'success' | 'open' | 'close') => {
    SoundManager.play(type);
  }, []);
  
  return { enabled, toggle, play };
}

// Theme Hook
function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light' | 'auto'>('dark');
  
  useEffect(() => {
    setThemeState(ThemeStore.get());
  }, []);
  
  const setTheme = useCallback((newTheme: 'dark' | 'light' | 'auto') => {
    ThemeStore.set(newTheme);
    setThemeState(newTheme);
  }, []);
  
  return { theme, setTheme };
}

// ═══════════════════════════════════════════════════════════════════
// EXISTENTIAL QUESTIONS SYSTEM
// ═══════════════════════════════════════════════════════════════════

const EXISTENTIAL_QUESTIONS = [
  { id: 1, text: "What would you do if you knew you couldn't fail?" },
  { id: 2, text: "What is within your control right now?" },
  { id: 3, text: "What virtue did you practice today?" },
  { id: 4, text: "What would you tell your younger self?" },
  { id: 5, text: "What obstacle is becoming your way?" },
  { id: 6, text: "When did you last feel truly alive?" },
  { id: 7, text: "What are you grateful for today?" },
  { id: 8, text: "What would the best version of yourself do?" },
  { id: 9, text: "Who has shaped who you are?" },
  { id: 10, text: "What truth are you avoiding?" },
  { id: 11, text: "What is enough for you?" },
  { id: 12, text: "What would make today meaningful?" },
  { id: 13, text: "What judgment are you making that causes suffering?" },
  { id: 14, text: "Where do you find peace?" },
  { id: 15, text: "What fear is holding you back?" },
  { id: 16, text: "What legacy do you want to leave?" },
  { id: 17, text: "What brings you joy without effort?" },
  { id: 18, text: "What is your relationship with time?" },
  { id: 19, text: "If today were your last, what would matter?" },
  { id: 20, text: "What are you holding onto that no longer serves you?" },
];

// Dummy answers data
const DUMMY_ANSWERS = [
  { id: 1, questionId: 2, text: "The call I need to make", name: null, approved: true, createdAt: "2026-01-03" },
  { id: 2, questionId: 2, text: "Myself", name: null, approved: true, createdAt: "2026-01-03" },
  { id: 3, questionId: 2, text: "A hard conversation with dad", name: "someone", approved: true, createdAt: "2026-01-02" },
  { id: 4, questionId: 2, text: "Sleep", name: null, approved: true, createdAt: "2026-01-04" },
  { id: 5, questionId: 2, text: "Growth", name: null, approved: true, createdAt: "2026-01-04" },
  { id: 6, questionId: 3, text: "My grandmother", name: null, approved: true, createdAt: "2026-01-02" },
  { id: 7, questionId: 3, text: "The person I used to be", name: "a wanderer", approved: true, createdAt: "2026-01-01" },
  { id: 8, questionId: 3, text: "An old friend who moved away", name: null, approved: true, createdAt: "2026-01-03" },
  { id: 9, questionId: 1, text: "Start my own company", name: null, approved: true, createdAt: "2026-01-04" },
  { id: 10, questionId: 1, text: "Write a book", name: "dreamer", approved: true, createdAt: "2026-01-04" },
  { id: 11, questionId: 5, text: "Regrets", name: null, approved: true, createdAt: "2026-01-03" },
  { id: 12, questionId: 5, text: "The future I can't control", name: null, approved: true, createdAt: "2026-01-02" },
  { id: 13, questionId: 10, text: "That I need to slow down", name: null, approved: true, createdAt: "2026-01-04" },
  { id: 14, questionId: 10, text: "I'm not happy", name: "anon", approved: true, createdAt: "2026-01-03" },
];

const DUMMY_VOTES: Record<number, number> = {
  1: 47,
  2: 89,
  3: 156,
  4: 34,
  5: 72,
  6: 45,
  7: 28,
  8: 61,
  9: 38,
  10: 93,
  11: 25,
  12: 41,
  13: 19,
  14: 55,
  15: 67,
  16: 82,
  17: 31,
  18: 44,
  19: 110,
  20: 58,
};

// Hook for questions system
function useQuestions() {
  const [votes, setVotes] = useState<Record<number, number>>(DUMMY_VOTES);
  const [userVotes, setUserVotes] = useState<number[]>([]);
  const [answers, setAnswers] = useState(DUMMY_ANSWERS);
  const [pendingAnswers, setPendingAnswers] = useState<typeof DUMMY_ANSWERS>([]);
  const [todayQuestionIndex, setTodayQuestionIndex] = useState(0);

  // Load from localStorage and set today's question on client
  useEffect(() => {
    const savedVotes = localStorage.getItem("question-votes");
    const savedUserVotes = localStorage.getItem("user-votes");
    const savedPending = localStorage.getItem("pending-answers");
    
    if (savedVotes) setVotes({ ...DUMMY_VOTES, ...JSON.parse(savedVotes) });
    if (savedUserVotes) setUserVotes(JSON.parse(savedUserVotes));
    if (savedPending) setPendingAnswers(JSON.parse(savedPending));
    
    // Calculate today's question on client only
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    setTodayQuestionIndex(dayOfYear % EXISTENTIAL_QUESTIONS.length);
  }, []);

  // Today's question
  const todayQuestion = EXISTENTIAL_QUESTIONS[todayQuestionIndex];

  // Vote for a question
  const vote = (questionId: number) => {
    if (userVotes.includes(questionId)) return;
    
    const newVotes = { ...votes, [questionId]: (votes[questionId] || 0) + 1 };
    const newUserVotes = [...userVotes, questionId];
    
    setVotes(newVotes);
    setUserVotes(newUserVotes);
    
    localStorage.setItem("question-votes", JSON.stringify(newVotes));
    localStorage.setItem("user-votes", JSON.stringify(newUserVotes));
  };

  // Submit answer (goes to pending)
  const submitAnswer = (questionId: number, text: string, name: string | null) => {
    const newAnswer = {
      id: Date.now(),
      questionId,
      text,
      name,
      approved: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    
    const newPending = [...pendingAnswers, newAnswer];
    setPendingAnswers(newPending);
    localStorage.setItem("pending-answers", JSON.stringify(newPending));
  };

  // Get answers for a question (only approved)
  const getAnswers = (questionId: number) => 
    answers.filter(a => a.questionId === questionId && a.approved);

  // Get questions sorted by votes
  const sortedQuestions = [...EXISTENTIAL_QUESTIONS].sort(
    (a, b) => (votes[b.id] || 0) - (votes[a.id] || 0)
  );

  return {
    todayQuestion,
    allQuestions: EXISTENTIAL_QUESTIONS,
    sortedQuestions,
    votes,
    userVotes,
    vote,
    submitAnswer,
    getAnswers,
    answers: answers.filter(a => a.approved),
    pendingAnswers,
  };
}

// ═══════════════════════════════════════════════════════════════════
// GENIUS COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// Parallax star field - simple CSS-based parallax
function ParallaxStars() {
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
  }>>([]);

  // Generate stars only on client to avoid hydration mismatch
  useEffect(() => {
    const generatedStars = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.4 + 0.1
    }));
    setStars(generatedStars);
  }, []);

  if (stars.length === 0) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 2, star.opacity],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// Ambient gradient that shifts with time
function AmbientGradient({ phase }: { phase: string }) {
  const gradients = {
    dawn: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.06) 0%, transparent 50%)",
    day: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.02) 0%, transparent 50%)",
    dusk: "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.06) 0%, transparent 50%)",
    night: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.04) 0%, transparent 50%)"
  };

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      style={{ background: gradients[phase as keyof typeof gradients] || gradients.day }}
    />
  );
}

// Scroll progress indicator - minimal line
function ScrollIndicator() {
  const progress = useScrollDepth();
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-px bg-white/20 origin-left z-50"
      style={{ scaleX: progress }}
    />
  );
}

// Presence timer - shows how long you've been here
function PresenceIndicator() {
  const { formatted } = usePresence();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 5 }}
      className="fixed bottom-6 left-6 text-[10px] text-gray-600 tracking-widest font-mono z-40"
    >
      present for {formatted}
    </motion.div>
  );
}

// Lunar Phase Display
function LunarPhase() {
  const { name, emoji, illumination } = useLunarPhase();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="text-center"
    >
      <p className="text-4xl mb-2">{emoji}</p>
      <p className="text-[9px] text-gray-600 tracking-widest uppercase">{name}</p>
    </motion.div>
  );
}

// Heartbeat Pulse - subtle life indicator
function HeartbeatPulse() {
  return (
    <motion.div
      className="fixed top-1/2 left-6 w-1 h-1 rounded-full bg-white/20 z-40"
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Life in Weeks Grid - famous visualization with Stoic theming
function LifeInWeeks({ onClose }: { onClose: () => void }) {
  const weeksTotal = 4000; // ~77 years
  const weeksLived = useMemo(() => {
    // Assume age 25 for demo - in real app this would be configured
    const birthYear = 2000;
    const now = new Date();
    const birth = new Date(birthYear, 0, 1);
    return Math.floor((now.getTime() - birth.getTime()) / (7 * 24 * 60 * 60 * 1000));
  }, []);

  const percentLived = ((weeksLived / weeksTotal) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8 cursor-pointer overflow-auto"
      style={{ backgroundColor: 'rgba(5,5,5,0.95)' }}
      onClick={onClose}
    >
      <div className="text-center my-auto" onClick={e => e.stopPropagation()}>
        <p 
          className="text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6"
          style={{ color: 'var(--accent-gold)', opacity: 0.8 }}
        >
          Memento Mori — Your Life in Weeks
        </p>
        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
          {weeksLived.toLocaleString()} weeks lived · {(weeksTotal - weeksLived).toLocaleString()} weeks remaining
        </p>
        <p className="text-sm mb-6 sm:mb-8" style={{ color: 'var(--text-muted)' }}>
          {percentLived}% of a 77-year life
        </p>
        
        {/* Responsive grid - fewer columns on mobile */}
        <div className="grid gap-[1px] sm:gap-[2px] mx-auto max-w-[280px] sm:max-w-[400px]" style={{ 
          gridTemplateColumns: `repeat(26, 1fr)`,
        }}>
          {/* Show fewer weeks on mobile for performance */}
          {Array.from({ length: Math.min(weeksTotal, 2000) }).map((_, i) => (
            <motion.div
              key={i}
              className="aspect-square w-full max-w-[6px] rounded-[1px] sm:rounded-sm"
              style={{
                backgroundColor: i < weeksLived 
                  ? 'var(--accent-gold)' 
                  : 'var(--border-primary)',
                opacity: i < weeksLived ? 0.6 : 0.3
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: i < weeksLived ? 0.6 : 0.3 }}
              transition={{ delay: i * 0.00005 }}
            />
          ))}
        </div>
        
        <p className="text-[9px] sm:text-[10px] mt-6 sm:mt-8 tracking-widest italic" style={{ color: 'var(--text-muted)' }}>
          "It is not that we have a short time to live, but that we waste a lot of it."
        </p>
        <p className="text-[8px] mt-1" style={{ color: 'var(--text-muted)' }}>— Seneca</p>
        <p className="text-[8px] sm:text-[9px] mt-6 tracking-widest" style={{ color: 'var(--text-muted)' }}>
          <span className="hidden sm:inline">ESC or</span> <span className="sm:hidden">Tap</span> to close
        </p>
      </div>
    </motion.div>
  );
}

// Konami Code Easter Egg Modal - Stoic Secret
function EasterEgg({ onClose }: { onClose: () => void }) {
  const secrets = [
    { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
    { text: "He suffers more than necessary, who suffers before it is necessary.", author: "Seneca" },
    { text: "Man is not worried by real problems so much as by his imagined anxieties about real problems.", author: "Epictetus" },
    { text: "The key is to keep company only with people who uplift you, whose presence calls forth your best.", author: "Epictetus" },
  ];
  
  const secret = secrets[Math.floor(Math.random() * secrets.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer p-6"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      onClick={onClose}
    >
      <div className="text-center max-w-md">
        <motion.div 
          className="text-6xl mb-8"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ◉
        </motion.div>
        <p 
          className="text-[10px] tracking-[0.4em] uppercase mb-6"
          style={{ color: 'var(--accent-gold)' }}
        >
          You found the inner citadel
        </p>
        <p 
          className="text-lg sm:text-xl font-light italic leading-relaxed mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          "{secret.text}"
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          — {secret.author}
        </p>
        <p className="text-[10px] mt-12 tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Click anywhere to return
        </p>
      </div>
    </motion.div>
  );
}

// Life progress - ultra minimal with Stoic theming
function MementoMori() {
  const { year, week, mounted } = useLifeProgress();
  const [hoursLeft, setHoursLeft] = useState(0);
  const { emoji, name } = useLunarPhase();
  
  useEffect(() => {
    setHoursLeft(24 - new Date().getHours());
  }, []);
  
  const daysLeft = mounted ? 365 - Math.floor(year * 3.65) : 0;
  const weeksLeft = mounted ? 52 - week : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 1 }}
      className="text-center"
    >
      <p 
        className="text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-6 sm:mb-8"
        style={{ color: 'var(--accent-gold)', opacity: 0.7 }}
      >
        memento mori
      </p>
      <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 flex-wrap" style={{ color: 'var(--text-muted)' }}>
        <div className="text-center">
          <p className="text-xl sm:text-2xl md:text-3xl font-extralight tabular-nums" style={{ color: 'var(--text-primary)' }}>{hoursLeft}</p>
          <p className="text-[7px] sm:text-[8px] md:text-[9px] tracking-widest uppercase mt-1">hours left</p>
        </div>
        <div className="w-px h-6 sm:h-8 hidden sm:block" style={{ backgroundColor: 'var(--border-primary)' }} />
        <div className="text-center">
          <p className="text-xl sm:text-2xl md:text-3xl font-extralight tabular-nums" style={{ color: 'var(--text-primary)' }}>{daysLeft}</p>
          <p className="text-[7px] sm:text-[8px] md:text-[9px] tracking-widest uppercase mt-1">days left</p>
        </div>
        <div className="w-px h-6 sm:h-8 hidden sm:block" style={{ backgroundColor: 'var(--border-primary)' }} />
        <div className="text-center">
          <p className="text-xl sm:text-2xl md:text-3xl font-extralight tabular-nums" style={{ color: 'var(--text-primary)' }}>{weeksLeft}</p>
          <p className="text-[7px] sm:text-[8px] md:text-[9px] tracking-widest uppercase mt-1">weeks left</p>
        </div>
        <div className="w-px h-6 sm:h-8 hidden sm:block" style={{ backgroundColor: 'var(--border-primary)' }} />
        <div className="text-center">
          <p className="text-xl sm:text-2xl md:text-3xl">{emoji}</p>
          <p className="text-[7px] sm:text-[8px] md:text-[9px] tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted)' }}>{name.split(" ")[0]}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Quote - single, powerful, changes daily - Enhanced Stoic collection
function DailyQuote() {
  const quotes = [
    { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", book: "Meditations X.16" },
    { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", book: "On the Shortness of Life" },
    { text: "The obstacle is the way.", author: "Marcus Aurelius", book: "Meditations V.20" },
    { text: "He who fears death will never do anything worthy of a man who is alive.", author: "Seneca", book: "Letters 77" },
    { text: "You have power over your mind—not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", book: "Meditations VI.7" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca", book: "Letters 13" },
    { text: "The best revenge is not to be like your enemy.", author: "Marcus Aurelius", book: "Meditations VI.6" },
    { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca", book: "Letters 101" },
    { text: "No man is free who is not master of himself.", author: "Epictetus", book: "Discourses" },
    { text: "First say to yourself what you would be; then do what you have to do.", author: "Epictetus", book: "Discourses III.23" },
    { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius", book: "Meditations V.16" },
    { text: "Caretake this moment. Immerse yourself in its particulars.", author: "Epictetus", book: "Discourses" },
    { text: "Amor Fati — Love your fate, which is in fact your life.", author: "Nietzsche (via Stoicism)", book: "" },
    { text: "How long are you going to wait before you demand the best for yourself?", author: "Epictetus", book: "Enchiridion 51" },
  ];
  
  // Same quote for the whole day
  const todayIndex = new Date().getDate() % quotes.length;
  const quote = quotes[todayIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, delay: 0.5 }}
      className="max-w-lg mx-auto text-center px-4 sm:px-0"
    >
      <p className="text-lg sm:text-xl md:text-2xl font-light leading-relaxed mb-3 sm:mb-4 italic" style={{ color: 'var(--text-secondary)' }}>
        "{quote.text}"
      </p>
      <p className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase" style={{ color: 'var(--text-muted)' }}>
        — {quote.author}
      </p>
      {quote.book && (
        <p className="text-[8px] sm:text-[9px] mt-1 tracking-wider" style={{ color: 'var(--accent-gold)', opacity: 0.6 }}>
          {quote.book}
        </p>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VIEW COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// iA Writer-style Focus Text Display
function FocusText({ text }: { text: string }) {
  const words = text.split(' ');
  const lastWordIndex = words.length - 1;

  return (
    <div className="leading-relaxed">
      {words.map((word, i) => {
        // Current word (last one) is bright, others progressively dim
        const isCurrentWord = i === lastWordIndex;
        const isPreviousWord = i === lastWordIndex - 1;
        
        return (
          <span
            key={i}
            className={`transition-all duration-150 ${
              isCurrentWord 
                ? 'text-white' 
                : isPreviousWord
                  ? 'text-gray-400'
                  : 'text-gray-600'
            }`}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
}

// Answer Modal Component with iA Writer Focus Mode
function AnswerModal({ 
  question, 
  onSubmit, 
  onClose 
}: { 
  question: typeof EXISTENTIAL_QUESTIONS[0];
  onSubmit: (text: string, name: string | null) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [showName, setShowName] = useState(false);
  const [name, setName] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(true);
  const maxChars = 280;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (text.trim().length === 0) return;
    onSubmit(text.trim(), showName && name.trim() ? name.trim() : null);
    onClose();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(120, textareaRef.current.scrollHeight) + 'px';
    }
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Question - dimmed when typing */}
        <motion.p 
          className={`text-center mb-8 sm:mb-12 text-base sm:text-lg font-light leading-relaxed transition-all duration-500 px-4 ${
            text.length > 0 ? 'text-gray-700 blur-[1px]' : 'text-gray-400'
          }`}
        >
          {question.text}
        </motion.p>

        {/* Focus Mode Writing Area */}
        <div className="relative">
          {/* Live Preview with Focus Effect */}
          {isFocusMode && text.length > 0 && (
            <div className="absolute inset-0 pointer-events-none text-base sm:text-lg md:text-xl font-light p-3 sm:p-4 whitespace-pre-wrap break-words">
              <FocusText text={text} />
            </div>
          )}
          
          {/* Actual Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value.slice(0, maxChars))}
            placeholder="Begin writing..."
            className={`w-full bg-transparent p-3 sm:p-4 text-base sm:text-lg md:text-xl font-light placeholder:text-gray-800 focus:outline-none resize-none min-h-[100px] sm:min-h-[120px] leading-relaxed ${
              isFocusMode && text.length > 0 ? 'text-transparent caret-white' : 'text-white'
            }`}
            autoFocus
          />
          
          {/* Cursor line indicator */}
          <motion.div 
            className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Bottom Controls - Ultra minimal */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Character count */}
            <span className={`text-[10px] tabular-nums transition-colors ${
              text.length > maxChars * 0.9 ? 'text-orange-500' : 'text-gray-700'
            }`}>
              {text.length}/{maxChars}
            </span>
            
            {/* Focus mode toggle */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`text-[10px] tracking-widest uppercase transition-colors py-1 ${
                isFocusMode ? 'text-gray-500' : 'text-gray-700'
              }`}
            >
              focus {isFocusMode ? 'on' : 'off'}
            </button>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Name toggle */}
            <button
              onClick={() => setShowName(!showName)}
              className={`text-[10px] tracking-widest uppercase transition-colors py-1 ${
                showName ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              {showName ? '+ name' : 'anon'}
            </button>
            
            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={text.trim().length === 0}
              className="text-[10px] tracking-widest uppercase text-white/80 hover:text-white active:text-white transition-colors disabled:text-gray-800 disabled:cursor-not-allowed py-2 px-4 -mr-4"
            >
              submit →
            </button>
          </div>
        </div>

        {/* Name input - expandable */}
        <AnimatePresence>
          {showName && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value.slice(0, 20))}
                placeholder="a name, alias, or nothing..."
                className="w-full bg-transparent text-center text-sm text-gray-400 placeholder:text-gray-800 focus:outline-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Escape hint */}
        <p className="text-center text-[8px] sm:text-[9px] text-gray-800 mt-8 sm:mt-12 tracking-widest">
          <span className="hidden sm:inline">ESC to close ·</span> <span className="sm:hidden">Tap outside to close ·</span> will be reviewed
        </p>
      </motion.div>
    </motion.div>
  );
}

// Questions List Modal
function QuestionsListModal({ 
  onClose,
  questions,
  votes,
  userVotes,
  onVote 
}: { 
  onClose: () => void;
  questions: typeof EXISTENTIAL_QUESTIONS;
  votes: Record<number, number>;
  userVotes: number[];
  onVote: (id: number) => void;
}) {
  const sorted = [...questions].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 md:p-8 overflow-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full max-h-[85vh] overflow-auto my-4 sm:my-0"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-[10px] text-gray-600 tracking-[0.4em] uppercase mb-2">All Questions</p>
        <p className="text-gray-500 text-xs mb-6 sm:mb-8">Vote for the ones you want me to write about</p>

        <div className="space-y-3 sm:space-y-4">
          {sorted.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start sm:items-center gap-3 sm:gap-4 group"
            >
              <button
                onClick={() => onVote(q.id)}
                disabled={userVotes.includes(q.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-sm transition-all flex-shrink-0 ${
                  userVotes.includes(q.id)
                    ? 'bg-white/10 text-white cursor-default'
                    : 'bg-gray-900 text-gray-500 hover:bg-gray-800 hover:text-white active:bg-gray-700'
                }`}
              >
                <span className="text-xs">▲</span>
                <span className="text-xs tabular-nums w-5 sm:w-6">{votes[q.id] || 0}</span>
              </button>
              <p className="text-gray-400 text-sm group-hover:text-white transition-colors leading-relaxed">
                {q.text}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="text-gray-700 text-[10px] mt-8 sm:mt-12 tracking-widest text-center">
          <span className="hidden sm:inline">ESC or</span> <span className="sm:hidden">Tap</span> outside to close
        </p>
      </motion.div>
    </motion.div>
  );
}

// Daily intentions from Juan - Stoic-inspired daily practices
const DAILY_INTENTIONS = [
  "Today I practice the dichotomy of control.",
  "Memento mori — remember you must die.",
  "Amor fati — love whatever happens.",
  "Focus on what depends on me alone.",
  "The obstacle is the way forward.",
  "Less but better. Depth over breadth.",
  "Present over perfect.",
  "Virtue is the only good.",
  "This too shall pass.",
  "Be the calm in the storm.",
  "Judge not the day by the harvest, but by the seeds planted.",
  "The best time to plant a tree was twenty years ago. The second best time is now.",
  "Progress, not perfection.",
  "What would the best version of myself do?",
];

// Collective Pulse - simulated presence
function useCollectivePulse() {
  const [present, setPresent] = useState(0);
  
  useEffect(() => {
    // Simulate 3-12 people present with slight fluctuation
    const base = 3 + Math.floor(Math.random() * 10);
    setPresent(base);
    
    const interval = setInterval(() => {
      setPresent(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        return Math.max(2, Math.min(15, next));
      });
    }, 8000); // Update every 8 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return present;
}

// Countdown to tomorrow
function useCountdownToTomorrow() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return timeLeft;
}

// Now View - Single Viewport Zen Layout
function NowView() {
  const { greeting } = useTimeAwareness();
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showQuestionsList, setShowQuestionsList] = useState(false);
  const [todayIntention, setTodayIntention] = useState(DAILY_INTENTIONS[0]);
  const countdown = useCountdownToTomorrow();
  const { 
    todayQuestion, 
    allQuestions,
    votes, 
    userVotes, 
    vote, 
    submitAnswer,
    sortedQuestions 
  } = useQuestions();

  // Today's intention (changes daily) - set on client only
  useEffect(() => {
    setTodayIntention(DAILY_INTENTIONS[new Date().getDate() % DAILY_INTENTIONS.length]);
  }, []);

  // Get top voted questions for "previous questions" section
  const previousQuestions = sortedQuestions
    .filter(q => q.id !== todayQuestion.id)
    .slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col justify-center px-5 sm:px-6 md:px-8 py-20 sm:py-24 overflow-x-hidden">
      {/* Main Content - Center Focal Point */}
      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
        {/* The Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 sm:mb-12"
        >
          <p className="text-[10px] sm:text-[11px] text-gray-500 tracking-[0.25em] sm:tracking-[0.3em] uppercase mb-4 sm:mb-5">
            today's question
          </p>
          
          <h1 className="text-[1.6rem] sm:text-3xl md:text-5xl lg:text-6xl font-extralight text-white leading-[1.25] sm:leading-[1.15] tracking-tight mb-6 sm:mb-8">
            {todayQuestion.text}
          </h1>

          {/* CTA Buttons - Better touch targets */}
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => vote(todayQuestion.id)}
              disabled={userVotes.includes(todayQuestion.id)}
              className={`group flex items-center gap-2 px-5 py-3 sm:px-4 sm:py-2.5 rounded-md transition-all duration-300 min-h-[44px] ${
                userVotes.includes(todayQuestion.id)
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white active:bg-white/15'
              }`}
            >
              <span className="group-hover:scale-110 transition-transform text-sm">▲</span>
              <span className="text-base tabular-nums font-light">{votes[todayQuestion.id] || 0}</span>
              <span className="text-[10px] tracking-wider uppercase opacity-80">
                {userVotes.includes(todayQuestion.id) ? 'voted' : 'vote'}
              </span>
            </button>
            
            <button
              onClick={() => setShowAnswerModal(true)}
              className="group px-5 py-3 sm:px-4 sm:py-2.5 text-gray-400 text-[10px] sm:text-[11px] tracking-wider uppercase hover:text-white active:text-white transition-all duration-300 border border-gray-700/50 hover:border-gray-600 rounded-md hover:bg-white/5 active:bg-white/10 min-h-[44px]"
            >
              answer <span className="inline-block group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>
        </motion.div>

        {/* Today's Intention - Hidden on small mobile for cleaner layout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8 sm:mb-10 hidden sm:block"
        >
          <p className="text-gray-500 text-sm font-light italic">
            "{todayIntention}"
          </p>
        </motion.div>

        {/* Bottom Section: Memento Mori + Contemplated - Centered on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-gray-800/30 pt-8 sm:pt-10"
        >
          {/* Desktop: Two column centered layout */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-16">
            
            {/* Left: Memento Mori */}
            <div className="lg:flex-1">
              <MementoMoriCompact />
              
              {/* Signature row */}
              <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] text-gray-500">
                <span className="tracking-wider uppercase">{greeting}</span>
                <span className="text-gray-700">·</span>
                <span className="text-gray-600">by Juan Maulana</span>
                <span className="text-gray-700">·</span>
                <span className="text-gray-500 tabular-nums font-mono">
                  {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    :{String(countdown.seconds).padStart(2, '0')}
                  </motion.span>
                </span>
              </div>
            </div>

            {/* Right: Contemplated - Vertical list on desktop */}
            <div className="lg:text-right">
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mb-4">contemplated</p>
              <div className="flex flex-col gap-2">
                {previousQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => vote(q.id)}
                    disabled={userVotes.includes(q.id)}
                    className="group flex items-center lg:justify-end gap-3 text-left lg:text-right py-1 active:text-white"
                  >
                    <span className="text-gray-500 text-sm group-hover:text-gray-300 group-active:text-white transition-colors lg:order-2">
                      {q.text}
                    </span>
                    <span className={`text-[11px] tabular-nums font-medium lg:order-1 ${userVotes.includes(q.id) ? 'text-white' : 'text-gray-600'}`}>
                      ▲{votes[q.id] || 0}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setShowQuestionsList(true)}
                  className="text-[10px] text-gray-600 tracking-wider uppercase hover:text-gray-400 active:text-white transition-colors py-1 lg:text-right"
                >
                  see all →
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAnswerModal && (
          <AnswerModal
            question={todayQuestion}
            onSubmit={(text, name) => submitAnswer(todayQuestion.id, text, name)}
            onClose={() => setShowAnswerModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuestionsList && (
          <QuestionsListModal
            onClose={() => setShowQuestionsList(false)}
            questions={allQuestions}
            votes={votes}
            userVotes={userVotes}
            onVote={vote}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact Memento Mori for single viewport - with Stoic styling
function MementoMoriCompact() {
  const { year, week, mounted } = useLifeProgress();
  const [hoursLeft, setHoursLeft] = useState(0);
  const { emoji, name } = useLunarPhase();
  
  useEffect(() => {
    setHoursLeft(24 - new Date().getHours());
  }, []);
  
  const daysLeft = mounted ? 365 - Math.floor(year * 3.65) : 0;
  const weeksLeft = mounted ? 52 - week : 0;
  
  return (
    <div>
      <p 
        className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase mb-4 sm:mb-5"
        style={{ color: 'var(--accent-gold)', opacity: 0.7 }}
      >
        memento mori
      </p>
      <div className="flex items-baseline gap-5 sm:gap-8 lg:gap-10">
        <div>
          <span className="text-2xl sm:text-3xl lg:text-4xl font-extralight tabular-nums" style={{ color: 'var(--text-primary)' }}>{hoursLeft}</span>
          <span className="text-sm sm:text-base lg:text-lg ml-1" style={{ color: 'var(--text-muted)' }}>h</span>
        </div>
        <div>
          <span className="text-2xl sm:text-3xl lg:text-4xl font-extralight tabular-nums" style={{ color: 'var(--text-primary)' }}>{daysLeft}</span>
          <span className="text-sm sm:text-base lg:text-lg ml-1" style={{ color: 'var(--text-muted)' }}>d</span>
        </div>
        <div>
          <span className="text-2xl sm:text-3xl lg:text-4xl font-extralight tabular-nums" style={{ color: 'var(--text-primary)' }}>{weeksLeft}</span>
          <span className="text-sm sm:text-base lg:text-lg ml-1" style={{ color: 'var(--text-muted)' }}>w</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl lg:text-4xl">{emoji}</span>
          <span className="text-[10px] sm:text-[11px] lg:text-xs tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>{name.split(" ")[0]}</span>
        </div>
      </div>
    </div>
  );
}

// Writing View
// Typewriter effect hook
function useTypewriter(text: string, speed: number = 50, startDelay: number = 0) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    setDisplayText("");
    setIsComplete(false);
    
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1));
          i++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, startDelay);
    
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);
  
  return { displayText, isComplete };
}

function WritingView() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredArticle, setHoveredArticle] = useState<number | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [readingMode, setReadingMode] = useState(false);
  
  // Featured quote that types out
  const { displayText: typedQuote, isComplete: quoteComplete } = useTypewriter(
    "Words are a lens to focus one's mind.",
    40,
    500
  );

  const writings = [
    { 
      id: 1,
      title: "On Simplicity", 
      date: "Jan 3, 2026", 
      reading: "4 min",
      category: "philosophy",
      excerpt: "In a world drowning in complexity, the radical act is to subtract. Every line of code not written is a bug avoided, every feature removed is clarity gained.",
      mood: "contemplative",
      words: 847,
      featured: true
    },
    { 
      id: 2,
      title: "Letters Never Sent", 
      date: "Dec 28, 2025", 
      reading: "8 min",
      category: "personal",
      excerpt: "There are conversations we rehearse in the shower, arguments we win at 3 AM, apologies that dissolve before they reach the air. This is a collection of unsent transmissions.",
      mood: "melancholic",
      words: 1624
    },
    { 
      id: 3,
      title: "Building with Intention", 
      date: "Dec 15, 2025", 
      reading: "5 min",
      category: "craft",
      excerpt: "Every git commit is a tiny time capsule. A message to your future self saying: here's what I was thinking. Make it count.",
      mood: "focused",
      words: 1089
    },
    { 
      id: 4,
      title: "The Art of Debugging Life", 
      date: "Dec 1, 2025", 
      reading: "6 min",
      category: "craft",
      excerpt: "The bug is never where you think it is. Not in relationships, not in career paths, not in the code. Trace back. Print everything. Question assumptions.",
      mood: "insightful",
      words: 1356
    },
    { 
      id: 5,
      title: "Morning Anomalies", 
      date: "Nov 20, 2025", 
      reading: "10 min",
      category: "personal",
      excerpt: "4:47 AM. The hour when insomnia transforms from curse to confession booth. Here are the things I've realized when the world stops pretending.",
      mood: "raw",
      words: 2134
    },
    { 
      id: 6,
      title: "Clean Code, Clear Mind", 
      date: "Nov 10, 2025", 
      reading: "7 min",
      category: "craft",
      excerpt: "Your codebase is a mirror. The chaos on screen reflects the chaos within. Refactor both.",
      mood: "focused",
      words: 1567
    },
  ];

  const categories = [
    { id: "all", label: "All", icon: "◉" },
    { id: "philosophy", label: "Philosophy", icon: "◇" },
    { id: "personal", label: "Personal", icon: "◈" },
    { id: "craft", label: "Craft", icon: "⬡" },
  ];

  const moodColors: Record<string, string> = {
    contemplative: "from-purple-500/20 to-transparent",
    melancholic: "from-blue-500/20 to-transparent", 
    focused: "from-green-500/20 to-transparent",
    insightful: "from-amber-500/20 to-transparent",
    raw: "from-red-500/20 to-transparent",
  };

  const filteredWritings = selectedCategory && selectedCategory !== "all"
    ? writings.filter(w => w.category === selectedCategory)
    : writings;

  const totalWords = writings.reduce((acc, w) => acc + w.words, 0);
  const totalReadingTime = writings.reduce((acc, w) => acc + parseInt(w.reading), 0);

  // Find featured article
  const featuredArticle = writings.find(w => w.featured);

  return (
    <div className="min-h-screen pt-16 sm:pt-24 md:pt-28 px-4 sm:px-6 md:px-8 pb-16 sm:pb-20 relative">
      {/* Ambient background based on hovered article mood */}
      <AnimatePresence>
        {hoveredArticle !== null && (
          <motion.div
            key={hoveredArticle}
            className={`fixed inset-0 bg-gradient-radial ${moodColors[writings.find(w => w.id === hoveredArticle)?.mood || 'contemplative']} pointer-events-none`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto relative">
        {/* Header with stats */}
        <div className="mb-12 sm:mb-16">
          <motion.div 
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] tracking-[0.3em] text-gray-500 uppercase">
              Writing in progress
            </span>
          </motion.div>

          <motion.h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-extralight text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Thoughts
          </motion.h1>

          {/* Typewriter Quote */}
          <motion.div 
            className="relative mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-400 text-lg sm:text-xl font-light italic">
              "{typedQuote}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={quoteComplete ? "opacity-0" : ""}
              >
                |
              </motion.span>"
            </p>
            <p className="text-gray-600 text-xs mt-2">— Ayn Rand</p>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            className="flex flex-wrap gap-6 sm:gap-10 text-xs text-gray-500 border-t border-b border-gray-800/30 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-600">◎</span>
              <span>{writings.length} essays</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">⧖</span>
              <span>{totalReadingTime} min total</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">⌘</span>
              <span>{totalWords.toLocaleString()} words</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-auto">
              <button 
                onClick={() => setReadingMode(!readingMode)}
                className={`flex items-center gap-2 px-3 py-1 rounded transition-all ${
                  readingMode 
                    ? 'bg-white/10 text-white' 
                    : 'hover:bg-white/5 text-gray-500'
                }`}
              >
                <span>◐</span>
                <span>Focus Mode</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Category Filter */}
        <motion.div 
          className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === "all" ? null : cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap ${
                (cat.id === "all" && !selectedCategory) || selectedCategory === cat.id
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Featured Article */}
        {featuredArticle && !selectedCategory && (
          <motion.article
            className="relative mb-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-gray-800/50 overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.01 }}
            onHoverStart={() => setHoveredArticle(featuredArticle.id)}
            onHoverEnd={() => setHoveredArticle(null)}
            onClick={() => setExpandedArticle(expandedArticle === featuredArticle.id ? null : featuredArticle.id)}
          >
            {/* Featured badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <span className="text-[10px] tracking-[0.2em] text-amber-500/80 uppercase flex items-center gap-2">
                <motion.span 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  ✦
                </motion.span>
                Featured
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
              {/* Left - Meta */}
              <div className="sm:w-32 flex-shrink-0">
                <span className="text-[10px] tracking-[0.2em] text-gray-600 uppercase">
                  {featuredArticle.category}
                </span>
                <div className="text-xs text-gray-500 mt-2">
                  {featuredArticle.date}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                  <span>⧖</span>
                  <span>{featuredArticle.reading}</span>
                </div>
              </div>

              {/* Right - Content */}
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-light text-white mb-4 group-hover:text-gray-200 transition-colors">
                  {featuredArticle.title}
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-4">
                  {featuredArticle.excerpt}
                </p>
                
                <AnimatePresence>
                  {expandedArticle === featuredArticle.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-gray-500 text-sm leading-relaxed pt-4 border-t border-gray-800/30"
                    >
                      <p className="mb-4">
                        The pursuit of simplicity is not laziness—it's the highest form of sophistication. 
                        When you strip away the unnecessary, what remains speaks with clarity.
                      </p>
                      <p>
                        In code, in design, in life: the question isn't "what can I add?" 
                        but "what can I remove while preserving meaning?"
                      </p>
                      <button className="mt-6 text-white text-xs flex items-center gap-2 group/btn">
                        <span>Continue reading</span>
                        <motion.span 
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          →
                        </motion.span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Word count visualization */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-gray-800 relative">
                    <motion.div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-white/40 to-transparent"
                      initial={{ width: 0 }}
                      animate={{ width: `${(featuredArticle.words / 2500) * 100}%` }}
                      transition={{ delay: 0.8, duration: 1 }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-600">{featuredArticle.words} words</span>
                </div>
              </div>
            </div>
          </motion.article>
        )}

        {/* Article Grid/List */}
        <motion.div 
          className={`grid gap-4 ${readingMode ? 'max-w-2xl mx-auto' : 'sm:grid-cols-2'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {filteredWritings
            .filter(w => !w.featured || selectedCategory)
            .map((w, i) => (
            <motion.article
              key={w.id}
              className={`group relative p-5 sm:p-6 rounded-xl border border-gray-800/30 cursor-pointer transition-all ${
                expandedArticle === w.id 
                  ? 'bg-white/5 border-gray-700/50' 
                  : 'hover:bg-white/5 hover:border-gray-700/50'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              onHoverStart={() => setHoveredArticle(w.id)}
              onHoverEnd={() => setHoveredArticle(null)}
              onClick={() => setExpandedArticle(expandedArticle === w.id ? null : w.id)}
              whileHover={{ y: -2 }}
            >
              {/* Mood indicator */}
              <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${moodColors[w.mood]} opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              <div className="flex items-start justify-between gap-4 mb-3">
                <span className="text-[10px] tracking-[0.2em] text-gray-600 uppercase">
                  {w.category}
                </span>
                <span className="text-xs text-gray-600">{w.reading}</span>
              </div>

              <h3 className="text-white font-light text-lg mb-2 group-hover:text-gray-200 transition-colors">
                {w.title}
              </h3>

              <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
                {w.excerpt}
              </p>

              <AnimatePresence>
                {expandedArticle === w.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-gray-800/30"
                  >
                    <button className="text-white text-xs flex items-center gap-2 group/btn">
                      <span>Read full essay</span>
                      <motion.span 
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800/20">
                <span className="text-xs text-gray-600">{w.date}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-700">{w.words}</span>
                  <div className="w-8 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gray-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${(w.words / 2500) * 100}%` }}
                      transition={{ delay: 0.5 + 0.1 * i }}
                    />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* Footer - Writing Streak */}
        <motion.div 
          className="mt-16 pt-8 border-t border-gray-800/30 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/5">
            <div className="flex -space-x-1">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < 5 ? 'bg-green-500/70' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              5 day writing streak
            </span>
            <span className="text-amber-500">🔥</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Work View - Interactive Project Showcase (matching Writing template)
function WorkView() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  // Typewriter effect for quote
  const { displayText: typedQuote, isComplete: quoteComplete } = useTypewriter(
    "First, do it. Then, do it right. Then, do it better.",
    40,
    500
  );

  const techIcons: Record<string, string> = {
    'Next.js': '▲',
    'React': '⚛',
    'Node.js': '⬡',
    'TypeScript': '◇',
    'Python': '◈',
    'PostgreSQL': '◎',
    'Redis': '◉',
    'Docker': '▣',
    'AWS': '☁',
    'Tailwind': '◐',
  };

  const projects = [
    { 
      id: 1,
      name: "This Portfolio", 
      desc: "Stoic-inspired personal website with hidden easter eggs",
      longDesc: "A deeply personal project exploring the intersection of philosophy and code. Built with Next.js 15, featuring time-aware atmosphere, interactive questions, and hidden terminal.",
      tech: ["Next.js", "TypeScript", "Tailwind"],
      category: "web",
      status: "live",
      year: "2026",
      link: "#",
      github: "github.com/user/portfolio",
      featured: true,
      metrics: { stars: 127, forks: 23 }
    },
    { 
      id: 2,
      name: "Mindful Analytics", 
      desc: "Real-time data visualization with a focus on clarity",
      longDesc: "Dashboard that prioritizes signal over noise. Custom charting library built from scratch to avoid cognitive overload.",
      tech: ["React", "TypeScript", "Python"],
      category: "data",
      status: "live",
      year: "2025",
      link: "#",
      metrics: { users: "2.3k", uptime: "99.9%" }
    },
    { 
      id: 3,
      name: "Stoic Commerce", 
      desc: "Minimalist marketplace for thoughtful consumption",
      longDesc: "E-commerce platform designed to reduce impulse buying. Features 'cooling off' periods and purchase reflection prompts.",
      tech: ["Node.js", "PostgreSQL", "Redis"],
      category: "web",
      status: "live",
      year: "2025",
      link: "#",
    },
    { 
      id: 4,
      name: "Focus Flow", 
      desc: "Cross-platform productivity app for deep work",
      longDesc: "Mobile application combining pomodoro technique with mindfulness exercises. No notifications, no streaks, no gamification.",
      tech: ["React", "TypeScript"],
      category: "mobile",
      status: "beta",
      year: "2025",
      link: "#",
      metrics: { downloads: "5k+" }
    },
  ];

  // Contribution heatmap data (simulated)
  const generateHeatmap = () => {
    const days = 52 * 7; // 52 weeks
    const data = [];
    for (let i = 0; i < days; i++) {
      data.push(Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0);
    }
    return data;
  };

  const heatmapData = useMemo(() => generateHeatmap(), []);
  const allTech = [...new Set(projects.flatMap(p => p.tech))];
  const filteredProjects = filter 
    ? projects.filter(p => p.tech.includes(filter))
    : projects;

  const statusColors: Record<string, string> = {
    live: 'bg-green-500',
    beta: 'bg-amber-500',
    wip: 'bg-blue-500',
  };

  // Find featured project
  const featuredProject = projects.find(p => p.featured);

  return (
    <div className="min-h-screen pt-16 sm:pt-24 md:pt-28 px-4 sm:px-6 md:px-8 pb-16 sm:pb-20 relative">
      <div className="max-w-4xl mx-auto">
        {/* Header with stats - matching Writing template */}
        <div className="mb-12 sm:mb-16">
          <motion.div 
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-gold)' }} />
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'var(--text-muted)' }}>
              Building in progress
            </span>
          </motion.div>

          <motion.h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 leading-tight"
            style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Work
          </motion.h1>

          {/* Typewriter Quote */}
          <motion.div 
            className="relative mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-lg sm:text-xl font-light italic" style={{ color: 'var(--text-tertiary)' }}>
              "{typedQuote}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={quoteComplete ? "opacity-0" : ""}
              >
                |
              </motion.span>"
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>— Addy Osmani</p>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            className="flex flex-wrap gap-6 sm:gap-10 text-xs py-4"
            style={{ 
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-secondary)',
              borderBottom: '1px solid var(--border-secondary)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)' }}>◎</span>
              <span>{projects.length} projects</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)' }}>◉</span>
              <span>{projects.filter(p => p.status === 'live').length} live</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)' }}>⬡</span>
              <span>{allTech.length} technologies</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--accent-gold)', opacity: 0.7 }}>★</span>
              <span>{projects.reduce((acc, p) => acc + (p.metrics?.stars || 0), 0)}+ stars</span>
            </div>
          </motion.div>
        </div>

        {/* Contribution Heatmap - GitHub style grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-10 p-4 rounded-lg"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
              {heatmapData.filter(d => d > 0).length} contributions in the last year
            </span>
          </div>
          
          {/* Heatmap Grid - 7 rows (days) x 52 cols (weeks) */}
          <div className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto pb-2">
            {heatmapData.map((level, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.001 }}
                className={`w-[10px] h-[10px] sm:w-3 sm:h-3 rounded-sm ${
                  level === 0 ? 'bg-[var(--border-primary)]' :
                  level === 1 ? 'bg-green-900/70' :
                  level === 2 ? 'bg-green-700' :
                  level === 3 ? 'bg-green-500' :
                  'bg-green-400'
                }`}
              />
            ))}
          </div>
          
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Less</span>
            {[0, 1, 2, 3, 4].map(l => (
              <div key={l} className={`w-[10px] h-[10px] sm:w-3 sm:h-3 rounded-sm ${
                l === 0 ? 'bg-[var(--border-primary)]' :
                l === 1 ? 'bg-green-900/70' :
                l === 2 ? 'bg-green-700' :
                l === 3 ? 'bg-green-500' :
                'bg-green-400'
              }`} />
            ))}
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>More</span>
          </div>
        </motion.div>

        {/* Tech Filter - Horizontal pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide"
        >
          <button
            onClick={() => setFilter(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap"
            style={{ 
              backgroundColor: !filter ? 'var(--text-primary)' : 'var(--bg-elevated)',
              color: !filter ? 'var(--bg-primary)' : 'var(--text-tertiary)',
              border: `1px solid ${!filter ? 'transparent' : 'var(--border-primary)'}`
            }}
          >
            <span>◉</span>
            <span>All</span>
          </button>
          {allTech.slice(0, 5).map(tech => (
            <button
              key={tech}
              onClick={() => setFilter(filter === tech ? null : tech)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap"
              style={{ 
                backgroundColor: filter === tech ? 'var(--text-primary)' : 'var(--bg-elevated)',
                color: filter === tech ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                border: `1px solid ${filter === tech ? 'transparent' : 'var(--border-primary)'}`
              }}
            >
              <span>{techIcons[tech] || '◆'}</span>
              <span>{tech}</span>
            </button>
          ))}
        </motion.div>

        {/* Featured Project - similar to Writing's featured article */}
        {featuredProject && !filter && (
          <motion.div
            className="relative mb-8 p-6 sm:p-8 rounded-2xl overflow-hidden group cursor-pointer"
            style={{ 
              background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-tertiary) 100%)',
              border: '1px solid var(--border-primary)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => setSelectedProject(selectedProject === featuredProject.id ? null : featuredProject.id)}
          >
            {/* Featured badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <span className="text-[10px] tracking-[0.2em] uppercase flex items-center gap-2" style={{ color: 'var(--accent-gold)' }}>
                <motion.span 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  ✦
                </motion.span>
                Featured
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
              {/* Left - Meta */}
              <div className="sm:w-32 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${statusColors[featuredProject.status]}`} />
                  <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    {featuredProject.status}
                  </span>
                </div>
                <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {featuredProject.year}
                </div>
              </div>

              {/* Right - Content */}
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-light mb-4 group-hover:opacity-80 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {featuredProject.name}
                </h2>
                <p className="text-sm sm:text-base leading-relaxed mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  {featuredProject.desc}
                </p>
                
                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {featuredProject.tech.map(tech => (
                    <span 
                      key={tech}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px]"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                    >
                      <span style={{ opacity: 0.6 }}>{techIcons[tech] || '◆'}</span>
                      {tech}
                    </span>
                  ))}
                </div>
                
                <AnimatePresence>
                  {selectedProject === featuredProject.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4"
                      style={{ borderTop: '1px solid var(--border-primary)' }}
                    >
                      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                        {featuredProject.longDesc}
                      </p>
                      
                      {featuredProject.metrics && (
                        <div className="flex gap-6 mb-4">
                          {Object.entries(featuredProject.metrics).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>{value}</span>
                              <span className="text-xs ml-1 capitalize" style={{ color: 'var(--text-muted)' }}>{key}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        <a href={featuredProject.link} className="text-xs flex items-center gap-2 group/btn" style={{ color: 'var(--text-primary)' }}>
                          <span>View Project</span>
                          <motion.span 
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            →
                          </motion.span>
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* Project Grid - matching Writing's article grid */}
        <motion.div 
          className="grid gap-4 sm:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {filteredProjects
            .filter(p => !p.featured || filter)
            .map((project, i) => (
            <motion.div
              key={project.id}
              className="group relative p-5 sm:p-6 rounded-xl cursor-pointer transition-all"
              style={{ 
                backgroundColor: selectedProject === project.id ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${selectedProject === project.id ? 'var(--border-primary)' : 'var(--border-secondary)'}` 
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
              whileHover={{ y: -2 }}
            >
              {/* Status indicator line */}
              <div 
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(to right, transparent, var(--accent-gold-dim), transparent)` }}
              />
              
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${statusColors[project.status]}`} />
                  <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    {project.status}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{project.year}</span>
              </div>

              <h3 className="font-light text-lg mb-2 group-hover:opacity-80 transition-colors" style={{ color: 'var(--text-primary)' }}>
                {project.name}
              </h3>

              <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: 'var(--text-tertiary)' }}>
                {project.desc}
              </p>

              <AnimatePresence>
                {selectedProject === project.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4"
                    style={{ borderTop: '1px solid var(--border-secondary)' }}
                  >
                    <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {project.longDesc}
                    </p>
                    
                    {project.metrics && (
                      <div className="flex gap-4 mb-4">
                        {Object.entries(project.metrics).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-base font-light" style={{ color: 'var(--text-primary)' }}>{value}</span>
                            <span className="text-[10px] ml-1 capitalize" style={{ color: 'var(--text-muted)' }}>{key}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <a href={project.link} className="text-xs flex items-center gap-2 group/btn" style={{ color: 'var(--text-primary)' }}>
                      <span>View project</span>
                      <motion.span 
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom info */}
              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.slice(0, 3).map(tech => (
                    <span 
                      key={tech}
                      className="text-[10px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {techIcons[tech] || '◆'}
                    </span>
                  ))}
                </div>
                {project.metrics?.stars && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: 'var(--accent-gold)', opacity: 0.7 }}>★</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{project.metrics.stars}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer - Coding streak (matching Writing's streak) */}
        <motion.div 
          className="mt-16 pt-8 text-center"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <div className="flex -space-x-1">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: i < 6 ? 'var(--accent-gold)' : 'var(--border-primary)', opacity: i < 6 ? 0.7 : 1 }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              6 day coding streak
            </span>
            <span>🔥</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// About View
// Voices View - Collective answers board
// Voice Waveform Component
function VoiceWaveform({ isPlaying = false }: { isPlaying?: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-8">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] bg-gradient-to-t from-purple-500/50 to-blue-500/50 rounded-full"
          animate={isPlaying ? {
            height: [8, 16 + Math.random() * 16, 8],
          } : { height: 8 }}
          transition={{
            duration: 0.3 + Math.random() * 0.3,
            repeat: isPlaying ? Infinity : 0,
            repeatType: "reverse",
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

function VoicesView() {
  const { answers, allQuestions, votes } = useQuestions();
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Simulated testimonials with voice/audio data
  const testimonials = [
    {
      id: 't1',
      text: "This portfolio made me pause and think. The questions, the design—everything feels intentional.",
      name: "Sarah Chen",
      role: "Designer at Figma",
      avatar: "S",
      color: "from-purple-500/20 to-blue-500/20",
      hasVoice: true,
      duration: "0:23"
    },
    {
      id: 't2', 
      text: "The hidden terminal easter egg is pure genius. I spent an hour exploring.",
      name: "Marcus Webb",
      role: "Engineer at Stripe",
      avatar: "M",
      color: "from-green-500/20 to-teal-500/20",
      hasVoice: true,
      duration: "0:18"
    },
    {
      id: 't3',
      text: "Finally, a developer portfolio that doesn't feel like every other one. The Stoic influences are beautiful.",
      name: "Anonymous",
      role: "Wandering Soul",
      avatar: "◉",
      color: "from-amber-500/20 to-orange-500/20",
      hasVoice: false
    },
    {
      id: 't4',
      text: "The memento mori feature genuinely changed how I think about my day. Uncomfortably profound.",
      name: "Yuki Tanaka",
      role: "Product at Notion",
      avatar: "Y",
      color: "from-pink-500/20 to-rose-500/20",
      hasVoice: true,
      duration: "0:31"
    },
  ];

  // Group answers by question
  const answersByQuestion = useMemo(() => {
    const grouped: Record<number, typeof answers> = {};
    answers.forEach(a => {
      if (!grouped[a.questionId]) grouped[a.questionId] = [];
      grouped[a.questionId].push(a);
    });
    return grouped;
  }, [answers]);

  const questionsWithAnswers = allQuestions.filter(q => answersByQuestion[q.id]?.length > 0);
  
  const displayedAnswers = selectedQuestion 
    ? (answersByQuestion[selectedQuestion] || [])
    : answers;

  const getRotation = (i: number) => {
    const rotations = [-2, 1, -1, 2, 0, -1.5, 1.5];
    return rotations[i % rotations.length];
  };

  const toggleVoice = (id: string) => {
    setPlayingVoice(playingVoice === id ? null : id);
  };

  return (
    <div className="min-h-screen pt-16 sm:pt-24 md:pt-28 px-4 sm:px-6 md:px-8 pb-16 sm:pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 sm:mb-16"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extralight text-white mb-4">
            Voices
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl">
            Echoes from strangers contemplating the same questions. Some leave words. Some leave their voice.
          </p>
        </motion.div>

        {/* Featured Testimonials with Voice Waveforms */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] tracking-[0.3em] text-gray-500 uppercase">Featured Voices</span>
            <div className="flex items-center gap-2">
              {testimonials.filter(t => t.hasVoice).length > 0 && (
                <span className="text-[10px] text-gray-600">
                  {testimonials.filter(t => t.hasVoice).length} audio messages
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="relative p-6 rounded-xl bg-gradient-to-br border border-gray-800/50 overflow-hidden group"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-20`} />
                
                <div className="relative">
                  {/* Quote */}
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 italic">
                    "{t.text}"
                  </p>

                  {/* Voice Waveform (if has voice) */}
                  {t.hasVoice && (
                    <div 
                      className="mb-4 p-3 bg-black/30 rounded-lg cursor-pointer hover:bg-black/50 transition-colors"
                      onClick={() => toggleVoice(t.id)}
                    >
                      <div className="flex items-center gap-3">
                        <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs hover:bg-white/20 transition-colors">
                          {playingVoice === t.id ? '❚❚' : '▶'}
                        </button>
                        <VoiceWaveform isPlaying={playingVoice === t.id} />
                        <span className="text-xs text-gray-500 ml-auto">{t.duration}</span>
                      </div>
                    </div>
                  )}

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-white text-sm">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-[10px] text-gray-600 tracking-widest">COMMUNITY ANSWERS</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* View Toggle & Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          {/* Question filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedQuestion(null)}
              className={`px-3 py-1.5 text-[10px] tracking-widest uppercase rounded-full transition-all flex-shrink-0 ${
                selectedQuestion === null 
                  ? 'bg-white text-black' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              All ({answers.length})
            </button>
            {questionsWithAnswers.slice(0, 3).map(q => (
              <button
                key={q.id}
                onClick={() => setSelectedQuestion(q.id)}
                className={`px-3 py-1.5 text-[10px] tracking-widest rounded-full transition-all max-w-[180px] truncate flex-shrink-0 ${
                  selectedQuestion === q.id 
                    ? 'bg-white text-black' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {q.text.slice(0, 25)}...
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                viewMode === 'grid' ? 'bg-white text-black' : 'text-gray-400'
              }`}
            >
              ▦ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                viewMode === 'list' ? 'bg-white text-black' : 'text-gray-400'
              }`}
            >
              ≡ List
            </button>
          </div>
        </motion.div>

        {/* Selected question header */}
        <AnimatePresence mode="wait">
          {selectedQuestion && (
            <motion.div
              key={selectedQuestion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 sm:p-6 rounded-xl bg-white/5 border border-gray-800/50"
            >
              <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">
                Question · ▲ {votes[selectedQuestion] || 0}
              </p>
              <p className="text-lg sm:text-xl text-white font-light">
                {allQuestions.find(q => q.id === selectedQuestion)?.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answers Grid/List */}
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' 
            : 'space-y-3'
        }`}>
          <AnimatePresence mode="popLayout">
            {displayedAnswers.map((answer, i) => (
              <motion.div
                key={answer.id}
                initial={{ opacity: 0, scale: 0.8, rotate: viewMode === 'grid' ? getRotation(i) : 0 }}
                animate={{ opacity: 1, scale: 1, rotate: viewMode === 'grid' ? getRotation(i) : 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ scale: viewMode === 'grid' ? 1.03 : 1.01, rotate: 0, zIndex: 10 }}
                className={`bg-gray-950 border border-gray-800/50 p-4 cursor-default group rounded-lg transition-colors hover:border-gray-700 ${
                  viewMode === 'list' ? 'flex items-start gap-4' : ''
                }`}
              >
                {viewMode === 'list' && (
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                    {(answer.name || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  {selectedQuestion === null && (
                    <p className="text-[8px] text-gray-600 tracking-widest uppercase mb-2 truncate">
                      {allQuestions.find(q => q.id === answer.questionId)?.text.slice(0, 30)}...
                    </p>
                  )}
                  <p className="text-gray-300 text-sm leading-relaxed mb-3 group-hover:text-white transition-colors">
                    "{answer.text}"
                  </p>
                  <p className="text-[9px] text-gray-600">
                    — {answer.name || "anonymous"}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {displayedAnswers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-600">◎</span>
            </div>
            <p className="text-gray-500 text-sm">No voices yet.</p>
            <p className="text-gray-600 text-xs mt-2">Be the first to share your thoughts.</p>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 pt-8 border-t border-gray-800/30 flex flex-wrap justify-center gap-8 sm:gap-12"
        >
          {[
            { label: 'Voices', value: answers.length + testimonials.length },
            { label: 'Questions', value: questionsWithAnswers.length },
            { label: 'Audio Messages', value: testimonials.filter(t => t.hasVoice).length },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl font-light text-white">{stat.value}</div>
              <div className="text-[10px] text-gray-600 tracking-widest uppercase mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function AboutView() {
  return (
    <div className="min-h-screen pt-20 sm:pt-28 md:pt-32 px-4 sm:px-6 md:px-8 pb-16 sm:pb-20">
      <div className="max-w-2xl mx-auto">
        <motion.h1 
          className="text-3xl sm:text-4xl font-extralight text-white mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          About
        </motion.h1>

        <motion.div 
          className="space-y-5 sm:space-y-6 text-gray-400 leading-relaxed mb-16 sm:mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-lg sm:text-xl text-gray-300 font-light">
            Developer. Writer. Thinker.
          </p>
          <p className="text-sm sm:text-base">
            I build digital products with a focus on simplicity and intentional design. 
            I believe the best interfaces are the ones you don't notice.
          </p>
          <p className="text-sm sm:text-base">
            Currently exploring the intersection of technology and philosophy—how 
            the tools we build shape the way we think, and vice versa.
          </p>
        </motion.div>

        {/* Values - Ultra minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-16 sm:mb-20"
        >
          <p className="text-[10px] text-gray-600 tracking-[0.3em] uppercase mb-6 sm:mb-8">Principles</p>
          <div className="space-y-3 sm:space-y-4">
            {[
              "Simplicity over complexity",
              "Intention over impulse", 
              "Depth over breadth",
              "Progress over perfection"
            ].map((v, i) => (
              <motion.p 
                key={v}
                className="text-gray-400 hover:text-white active:text-white transition-colors cursor-default text-sm sm:text-base"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {v}
              </motion.p>
            ))}
          </div>
        </motion.div>

        {/* Contact - Minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-[10px] text-gray-600 tracking-[0.3em] uppercase mb-4 sm:mb-6">Connect</p>
          <div className="flex gap-6 sm:gap-8">
            {["Email", "GitHub", "Twitter"].map((link) => (
              <a 
                key={link}
                href="#" 
                className="text-gray-500 hover:text-white active:text-white transition-colors text-sm py-1"
              >
                {link}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HIDDEN TERMINAL EASTER EGG
// ═══════════════════════════════════════════════════════════════════

function HiddenTerminal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ type: 'input' | 'output' | 'error' | 'system'; text: string }[]>([
    { type: 'system', text: '░░░ GHOST TERMINAL v1.0 ░░░' },
    { type: 'system', text: 'A contemplative interface for the wandering mind.' },
    { type: 'output', text: 'Type "help" for available commands. Type "exit" to return.' },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const { play } = useSound();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    historyRef.current?.scrollTo(0, historyRef.current.scrollHeight);
  }, [history]);

  const typeResponse = async (text: string, type: 'output' | 'error' | 'system' = 'output') => {
    setIsTyping(true);
    for (let i = 0; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, 20));
      setHistory(h => {
        const newHistory = [...h];
        if (i === 1) {
          newHistory.push({ type, text: text.slice(0, i) });
        } else if (newHistory.length > 0) {
          newHistory[newHistory.length - 1] = { type, text: text.slice(0, i) };
        }
        return newHistory;
      });
      play('type');
    }
    setIsTyping(false);
  };

  const commands: Record<string, () => Promise<void>> = {
    help: async () => {
      await typeResponse(`
Available commands:
  help       - Show this message
  whoami     - Who am I?
  fortune    - Receive Stoic wisdom
  meditate   - Begin a brief meditation
  virtue     - Learn about the four Stoic virtues
  dichotomy  - The dichotomy of control
  journal    - Evening reflection prompts
  memento    - Memento mori reminder
  premeditatio - Prepare for adversity
  weather    - Check the inner weather
  matrix     - Enter the void
  clear      - Clear terminal
  theme      - Toggle theme
  sound      - Toggle sound
  secret     - ???
  exit       - Close terminal
      `.trim());
    },
    whoami: async () => {
      await typeResponse("You are a consciousness experiencing itself through a terminal.");
      await new Promise(r => setTimeout(r, 800));
      await typeResponse("A soul temporarily housed in flesh, capable of reason and virtue.");
    },
    fortune: async () => {
      const fortunes = [
        { text: "The obstacle is the way.", source: "Marcus Aurelius, Meditations V.20" },
        { text: "What stands in the way becomes the way.", source: "Marcus Aurelius" },
        { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", source: "Marcus Aurelius, Meditations VI.7" },
        { text: "The best revenge is not to be like your enemy.", source: "Marcus Aurelius, Meditations VI.6" },
        { text: "It is not death that a man should fear, but he should fear never beginning to live.", source: "Marcus Aurelius, Meditations VIII.36" },
        { text: "Waste no more time arguing about what a good man should be. Be one.", source: "Marcus Aurelius, Meditations X.16" },
        { text: "The happiness of your life depends upon the quality of your thoughts.", source: "Marcus Aurelius, Meditations IV.3" },
        { text: "Very little is needed to make a happy life; it is all within yourself.", source: "Marcus Aurelius, Meditations VII.67" },
        { text: "He who fears death will never do anything worthy of a living man.", source: "Seneca, Letters 77" },
        { text: "The soul becomes dyed with the color of its thoughts.", source: "Marcus Aurelius, Meditations V.16" },
        { text: "We suffer more often in imagination than in reality.", source: "Seneca, Letters 13" },
        { text: "No man is free who is not master of himself.", source: "Epictetus, Discourses" },
        { text: "Difficulties strengthen the mind, as labor does the body.", source: "Seneca, Letters 78" },
        { text: "Begin at once to live, and count each separate day as a separate life.", source: "Seneca, Letters 101" },
      ];
      const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      await typeResponse(`"${fortune.text}"`);
      await new Promise(r => setTimeout(r, 500));
      await typeResponse(`— ${fortune.source}`);
    },
    meditate: async () => {
      await typeResponse("Close your eyes. Take a deep breath in... 4 seconds.");
      await new Promise(r => setTimeout(r, 4000));
      await typeResponse("Hold... 4 seconds.");
      await new Promise(r => setTimeout(r, 4000));
      await typeResponse("Release slowly... 4 seconds.");
      await new Promise(r => setTimeout(r, 4000));
      await typeResponse("You are here. This moment is all that exists.");
      await new Promise(r => setTimeout(r, 2000));
      await typeResponse("What is within your control right now?");
    },
    virtue: async () => {
      await typeResponse("The Four Stoic Virtues:");
      await new Promise(r => setTimeout(r, 500));
      await typeResponse("🧠 WISDOM (Sophia) — Knowing what is truly good, bad, and indifferent.");
      await new Promise(r => setTimeout(r, 400));
      await typeResponse("⚔️  COURAGE (Andreia) — Acting rightly despite fear or difficulty.");
      await new Promise(r => setTimeout(r, 400));
      await typeResponse("⚖️  JUSTICE (Dikaiosyne) — Treating others with fairness and kindness.");
      await new Promise(r => setTimeout(r, 400));
      await typeResponse("🎯 TEMPERANCE (Sophrosyne) — Moderation and self-control in all things.");
      await new Promise(r => setTimeout(r, 800));
      await typeResponse("Which virtue calls to you today?");
    },
    dichotomy: async () => {
      await typeResponse("THE DICHOTOMY OF CONTROL");
      await new Promise(r => setTimeout(r, 600));
      await typeResponse("┌─────────────────────────────────────────────┐");
      await typeResponse("│  ✓ WITHIN YOUR CONTROL                      │");
      await typeResponse("│    · Your judgments and opinions             │");
      await typeResponse("│    · Your desires and aversions              │");
      await typeResponse("│    · Your actions and responses              │");
      await typeResponse("│    · Your effort and attention               │");
      await typeResponse("├─────────────────────────────────────────────┤");
      await typeResponse("│  ✗ OUTSIDE YOUR CONTROL                     │");
      await typeResponse("│    · Other people's actions                  │");
      await typeResponse("│    · The past and the future                │");
      await typeResponse("│    · Your reputation and fame               │");
      await typeResponse("│    · Health, wealth, and external events    │");
      await typeResponse("└─────────────────────────────────────────────┘");
      await new Promise(r => setTimeout(r, 800));
      await typeResponse('"Make the best use of what is in your power, and take the rest as it happens." — Epictetus');
    },
    journal: async () => {
      await typeResponse("EVENING REFLECTION — A Stoic Practice");
      await new Promise(r => setTimeout(r, 600));
      await typeResponse("Answer these three questions from Seneca:");
      await new Promise(r => setTimeout(r, 400));
      await typeResponse("1. What bad habit have I curbed today?");
      await new Promise(r => setTimeout(r, 400));
      await typeResponse("2. What virtue have I practiced?");
      await new Promise(r => setTimeout(r, 400));
      await typeResponse("3. In what way am I better than yesterday?");
      await new Promise(r => setTimeout(r, 800));
      await typeResponse("Take a moment. Write your answers somewhere private.");
    },
    memento: async () => {
      await typeResponse("MEMENTO MORI — Remember you must die.");
      await new Promise(r => setTimeout(r, 1000));
      const now = new Date();
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
      const daysLeft = Math.floor((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const hoursLeft = 24 - now.getHours();
      await typeResponse(`${hoursLeft} hours remain in this day.`);
      await typeResponse(`${daysLeft} days remain in this year.`);
      await new Promise(r => setTimeout(r, 800));
      await typeResponse("Let this not frighten you, but free you.");
      await typeResponse("Death is not the opposite of life—it is the frame that gives life meaning.");
    },
    premeditatio: async () => {
      await typeResponse("PREMEDITATIO MALORUM — The Premeditation of Adversity");
      await new Promise(r => setTimeout(r, 600));
      await typeResponse("The Stoics practiced imagining potential hardships to prepare for them.");
      await new Promise(r => setTimeout(r, 500));
      await typeResponse("Ask yourself:");
      await typeResponse("· What could go wrong today?");
      await typeResponse("· How would I respond with virtue?");
      await typeResponse("· What is the worst that could happen?");
      await typeResponse("· Could I survive it? (Yes, you can.)");
      await new Promise(r => setTimeout(r, 800));
      await typeResponse('"It is in times of security that the spirit should be preparing itself for difficult times." — Seneca');
    },
    matrix: async () => {
      await typeResponse("Wake up, Neo... The Matrix has you...");
      await new Promise(r => setTimeout(r, 1000));
      await typeResponse("Follow the white rabbit.");
      await new Promise(r => setTimeout(r, 1000));
      await typeResponse("Knock, knock.");
    },
    weather: async () => {
      const moods = [
        "Partly cloudy with a chance of existential clarity.",
        "Overcast. Perfect weather for introspection.",
        "Clear skies. The mind reflects the cosmos.",
        "Foggy. Some things are better left unseen.",
        "Thunderstorms of creativity approaching.",
        "A gentle rain of perspective falling.",
        "The sun sets on yesterday's worries. Tomorrow is unwritten.",
      ];
      await typeResponse(moods[Math.floor(Math.random() * moods.length)]);
    },
    clear: async () => {
      setHistory([
        { type: 'system', text: '░░░ GHOST TERMINAL v1.0 ░░░' },
        { type: 'output', text: 'Terminal cleared.' },
      ]);
    },
    theme: async () => {
      await typeResponse("Theme toggled. (Not really, but imagine it did.)");
    },
    sound: async () => {
      const newState = SoundManager.toggle();
      await typeResponse(`Sound ${newState ? 'enabled' : 'disabled'}.`);
    },
    secret: async () => {
      await typeResponse("🕳️ You found the rabbit hole.");
      await new Promise(r => setTimeout(r, 500));
      await typeResponse("Not all who wander are lost...");
      await new Promise(r => setTimeout(r, 500));
      await typeResponse("...but some are exactly where they need to be.");
      await new Promise(r => setTimeout(r, 800));
      await typeResponse("Try: 'stoic' for a hidden teaching.");
    },
    stoic: async () => {
      await typeResponse("THE INNER CITADEL");
      await new Promise(r => setTimeout(r, 600));
      await typeResponse("There is a place within you that cannot be touched.");
      await typeResponse("No external force can enter without your permission.");
      await typeResponse("This is your inner citadel—your ruling reason.");
      await new Promise(r => setTimeout(r, 800));
      await typeResponse("Retreat there when the world grows loud.");
      await typeResponse("From there, you can face anything.");
    },
    exit: async () => {
      await typeResponse("Returning to the surface...");
      await new Promise(r => setTimeout(r, 500));
      onClose();
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const cmd = input.toLowerCase().trim();
    setHistory(h => [...h, { type: 'input', text: `> ${input}` }]);
    setInput("");
    play('click');

    if (commands[cmd]) {
      await commands[cmd]();
    } else if (cmd) {
      await typeResponse(`Command not found: ${cmd}. Type "help" for available commands.`, 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl h-[70vh] bg-gray-950 border border-gray-800 rounded-lg overflow-hidden flex flex-col font-mono"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer hover:bg-red-500" onClick={onClose} />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] text-gray-500 tracking-widest">ghost@terminal ~ </span>
          <div className="w-16" />
        </div>

        {/* Terminal Body */}
        <div 
          ref={historyRef}
          className="flex-1 overflow-y-auto p-4 space-y-1 text-sm"
        >
          {history.map((line, i) => (
            <div 
              key={i} 
              className={`${
                line.type === 'input' ? 'text-green-400' :
                line.type === 'error' ? 'text-red-400' :
                line.type === 'system' ? 'text-purple-400' :
                'text-gray-400'
              } whitespace-pre-wrap`}
            >
              {line.text}
            </div>
          ))}
          {isTyping && (
            <span className="inline-block w-2 h-4 bg-green-400 animate-pulse" />
          )}
        </div>

        {/* Terminal Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-gray-800">
          <span className="text-green-400">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none text-white text-sm"
            placeholder={isTyping ? "" : "Type a command..."}
            disabled={isTyping}
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AI CHAT EASTER EGG - Contemplative Companion
// ═══════════════════════════════════════════════════════════════════

function AIChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello, wanderer. I am a reflection of the quiet spaces between thoughts. What weighs on your mind?" }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current?.scrollTo(0, messagesRef.current.scrollHeight);
  }, [messages]);

  const contemplativeResponses = [
    "That reminds me of Marcus Aurelius... 'The soul becomes dyed with the color of its thoughts.' What color is your soul taking on?",
    "Interesting. Seneca wrote that we suffer more often in imagination than in reality. Is your fear about what is, or what might be?",
    "The Stoics would ask: Is this within your control? If yes, act. If no, accept. Where does your concern fall?",
    "In the silence between your words, I sense something deeper. What aren't you saying?",
    "Epictetus taught that it's not events that disturb us, but our judgments about them. What judgment are you making?",
    "Perhaps the question isn't about finding answers, but about learning to sit with uncertainty. Can you befriend the unknown?",
    "You speak of change. But as Heraclitus said, you cannot step into the same river twice. Change is the only constant.",
    "There's a Stoic practice called 'the view from above'—imagining yourself from space, seeing the smallness of your troubles. Try it now.",
    "The wound is the place where the light enters you. — Rumi. What light is trying to enter through your difficulty?",
    "Before seeking solutions, have you fully experienced the problem? Sometimes understanding is enough.",
    "What would your future self, looking back, wish you had understood in this moment?",
    "I notice you're reaching for certainty in an uncertain world. That's very human. But freedom lies in accepting uncertainty.",
    "The obstacle you describe... what if it's not blocking your path, but IS your path? The Stoics called this 'the obstacle is the way.'",
    "Sometimes the most profound act is simply to pause. To breathe. To let things be as they are. What would happen if you stopped trying to fix this?",
    "Marcus Aurelius wrote his Meditations as notes to himself. This conversation is your meditation. What are you learning?",
    "Amor fati—love your fate. Can you find something to love in this situation you're describing?",
    "Seneca practiced 'premeditatio malorum'—imagining the worst outcomes to diminish fear. What's the worst that could happen here?",
    "The inner citadel of the Stoics—a place within that cannot be touched by external events. Have you visited yours lately?",
    "Every difficulty is training for your character. What virtue is this situation calling you to develop?",
    "Remember: you are not your thoughts. You are the awareness observing them. What do you notice when you step back?",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setMessages(m => [...m, { role: 'user', text: userMessage }]);
    setInput("");
    setIsThinking(true);

    // Simulate thinking
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));

    // Select a contemplative response
    const response = contemplativeResponses[Math.floor(Math.random() * contemplativeResponses.length)];
    setMessages(m => [...m, { role: 'ai', text: response }]);
    setIsThinking(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-gold-dim), rgba(201, 162, 39, 0.05))' }}>
              <span className="text-lg" style={{ color: 'var(--accent-gold)' }}>◉</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2" style={{ borderColor: 'var(--bg-primary)' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-light" style={{ color: 'var(--text-primary)' }}>The Stoic Oracle</p>
            <p className="text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>contemplating with you...</p>
          </div>
          <button onClick={onClose} className="p-2 transition-colors" style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        {/* Messages */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-white/10 text-white' 
                  : 'bg-gray-900 text-gray-300'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-900 px-4 py-3 rounded-2xl flex gap-1">
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-gray-500" 
                />
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-gray-500" 
                />
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }} 
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-gray-500" 
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share your thoughts..."
              className="flex-1 bg-gray-900 rounded-full px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-gray-700"
              disabled={isThinking}
            />
            <button
              type="submit"
              disabled={isThinking || !input.trim()}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              ↑
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS MODAL
// ═══════════════════════════════════════════════════════════════════

function KeyboardShortcuts({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: '1-5', action: 'Navigate between sections' },
    { key: 'F', action: 'Enter Stoic breathing meditation' },
    { key: 'L', action: 'View Life in Weeks (memento mori)' },
    { key: '~', action: 'Open Ghost Terminal (try: virtue, dichotomy, journal)' },
    { key: 'C', action: 'Chat with The Stoic Oracle' },
    { key: 'S', action: 'Toggle ambient sounds' },
    { key: 'T', action: 'Cycle theme (dark/light)' },
    { key: '?', action: 'Show this modal' },
    { key: 'ESC', action: 'Close any modal' },
    { key: 'double-click', action: 'Quick focus mode' },
    { key: '↑↑↓↓←→←→BA', action: 'Hidden wisdom 🎮' },
  ];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] backdrop-blur-sm flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl p-6"
        style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--text-muted)' }}>ESC</button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid var(--border-secondary)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{s.action}</span>
              <kbd 
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {s.key}
              </kbd>
            </motion.div>
          ))}
        </div>

        <p className="text-xs mt-6 text-center" style={{ color: 'var(--text-muted)' }}>
          "The secret of happiness is not in doing what one likes,<br/>but in liking what one does."
        </p>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INTERACTIVE CODE PLAYGROUND
// ═══════════════════════════════════════════════════════════════════

function CodePlayground({ 
  initialCode = '// Write your code here\nconsole.log("Hello, world!");',
  language = 'javascript',
  onClose 
}: { 
  initialCode?: string; 
  language?: string;
  onClose?: () => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setOutput([]);
    
    // Create a custom console
    const logs: string[] = [];
    const customConsole = {
      log: (...args: unknown[]) => logs.push(args.map(a => String(a)).join(' ')),
      error: (...args: unknown[]) => logs.push(`[Error] ${args.map(a => String(a)).join(' ')}`),
      warn: (...args: unknown[]) => logs.push(`[Warn] ${args.map(a => String(a)).join(' ')}`),
    };

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('console', code);
      await fn(customConsole);
      setOutput(logs.length > 0 ? logs : ['(no output)']);
    } catch (err) {
      setOutput([`Error: ${err instanceof Error ? err.message : String(err)}`]);
    }
    
    setIsRunning(false);
  };

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 tracking-widest uppercase">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs rounded transition-colors disabled:opacity-50"
          >
            {isRunning ? '⧖' : '▶'} Run
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-white text-sm">✕</button>
          )}
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-40 bg-transparent p-4 text-sm font-mono text-gray-300 outline-none resize-none"
        spellCheck={false}
      />

      {/* Output */}
      {output.length > 0 && (
        <div className="border-t border-gray-800 p-4 bg-gray-900/50">
          <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">Output</p>
          <div className="font-mono text-sm space-y-1">
            {output.map((line, i) => (
              <div key={i} className={line.startsWith('[Error]') ? 'text-red-400' : 'text-gray-400'}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Focus Mode - Enhanced Stoic Breathing meditation with quote progression
function FocusMode({ onClose }: { onClose: () => void }) {
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [showQuote, setShowQuote] = useState(false);
  
  const stoicQuotes = [
    "The soul becomes dyed with the color of its thoughts.",
    "You have power over your mind—not outside events.",
    "The obstacle is the way.",
    "Waste no more time arguing about what a good man should be. Be one.",
    "We suffer more often in imagination than in reality.",
    "Begin at once to live.",
    "No man is free who is not master of himself.",
    "The happiness of your life depends on the quality of your thoughts.",
  ];
  
  const currentQuote = stoicQuotes[breathCount % stoicQuotes.length];
  
  useEffect(() => {
    // Box breathing: 4-4-4-4 pattern
    const cycle = () => {
      setBreathPhase("inhale");
      setTimeout(() => setBreathPhase("hold"), 4000);
      setTimeout(() => setBreathPhase("exhale"), 8000);
      setTimeout(() => {
        setBreathPhase("rest");
        setBreathCount(c => c + 1);
      }, 12000);
    };
    cycle();
    const timer = setInterval(cycle, 16000); // Full cycle: 16 seconds
    
    // Show quote after 3 breaths
    const quoteTimer = setTimeout(() => setShowQuote(true), 48000);
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    
    return () => {
      clearInterval(timer);
      clearTimeout(quoteTimer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const phaseText = {
    inhale: "breathe in",
    hold: "hold",
    exhale: "breathe out",
    rest: "rest"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      onClick={onClose}
    >
      <div className="text-center max-w-lg">
        {/* Breathing circle with golden accent */}
        <motion.div
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-8 sm:mb-12 relative"
          style={{ border: '1px solid var(--accent-gold-dim)' }}
          animate={{
            scale: breathPhase === "inhale" ? 1.5 : breathPhase === "exhale" ? 1 : breathPhase === "hold" ? 1.5 : 1,
            opacity: breathPhase === "rest" ? 0.3 : 0.6,
            borderColor: breathPhase === "hold" ? 'var(--accent-gold)' : 'var(--accent-gold-dim)',
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
        >
          {/* Inner pulse */}
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{ backgroundColor: 'var(--accent-gold-dim)' }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Breath phase indicator */}
        <motion.p
          key={breathPhase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 0.7, y: 0 }}
          className="text-sm tracking-[0.3em] uppercase mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          {phaseText[breathPhase]}
        </motion.p>

        {/* Breath counter */}
        <motion.p
          className="text-[10px] tracking-widest mb-8"
          style={{ color: 'var(--text-muted)' }}
        >
          breath {breathCount + 1}
        </motion.p>

        {/* Quote appears after some breaths */}
        <AnimatePresence>
          {showQuote && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="max-w-md mx-auto"
            >
              <p 
                className="text-lg sm:text-xl font-light italic leading-relaxed mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                "{currentQuote}"
              </p>
              <p 
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: 'var(--accent-gold)', opacity: 0.6 }}
              >
                — Marcus Aurelius
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exit hint */}
        <p 
          className="text-[9px] sm:text-[10px] mt-12 sm:mt-16 tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="hidden sm:inline">ESC to return</span>
          <span className="sm:hidden">Tap to return</span>
        </p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("now");
  const [showFocus, setShowFocus] = useState(false);
  const [showLifeWeeks, setShowLifeWeeks] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { phase } = useTimeAwareness();
  const { theme, setTheme } = useTheme();
  const { enabled: soundEnabled, toggle: toggleSound, play } = useSound();

  // Mark as mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Konami Code Easter Egg
  useKonamiCode(() => setShowEasterEgg(true));

  // Terminal trigger (~ key)
  useTerminalTrigger(() => {
    if (!isLoading) {
      setShowTerminal(true);
      play('open');
    }
  });

  // Secret: Double-click anywhere for focus mode
  const lastClick = useRef(0);
  const handleDoubleClick = () => {
    const now = Date.now();
    if (now - lastClick.current < 300) {
      setShowFocus(true);
      play('open');
    }
    lastClick.current = now;
  };

  // Close all modals
  const closeAllModals = useCallback(() => {
    setShowFocus(false);
    setShowLifeWeeks(false);
    setShowEasterEgg(false);
    setShowTerminal(false);
    setShowAIChat(false);
    setShowShortcuts(false);
    play('close');
  }, [play]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Don't process if any modal is open (except Escape)
      const anyModalOpen = showTerminal || showAIChat || showShortcuts || showFocus || showLifeWeeks || showEasterEgg;
      
      if (e.key === "Escape") {
        closeAllModals();
        return;
      }
      
      if (anyModalOpen) return;
      
      switch(e.key.toLowerCase()) {
        case 'f':
          setShowFocus(true);
          play('open');
          break;
        case 'l':
          setShowLifeWeeks(true);
          play('open');
          break;
        case 'c':
          setShowAIChat(true);
          play('open');
          break;
        case 's':
          toggleSound();
          break;
        case 't':
          setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark');
          play('click');
          break;
        case '?':
          setShowShortcuts(true);
          play('open');
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLoading, showTerminal, showAIChat, showShortcuts, showFocus, showLifeWeeks, showEasterEgg, closeAllModals, play, toggleSound, setTheme, theme]);

  // Smooth page transition variants
  const pageTransition = {
    initial: { opacity: 0, y: 20, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -20, filter: "blur(10px)" },
  };

  // Apply theme class to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme === 'light' ? 'light' : 'dark');
    }
  }, [theme]);

  return (
    <>
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      <main 
        className="min-h-screen antialiased selection:bg-blue-500/20 transition-colors duration-500"
        style={{ 
          backgroundColor: 'var(--bg-primary)', 
          color: 'var(--text-primary)' 
        }}
        onClick={handleDoubleClick}
        suppressHydrationWarning
      >
        {/* Ambient layers - only render after mount to avoid hydration issues */}
        {mounted && theme === 'dark' && <ParallaxStars />}
        {theme === 'dark' && <AmbientGradient phase={phase} />}
        {theme === 'dark' && <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/50" />}
        
        {/* UI */}
        <ScrollIndicator />
        <HeartbeatPulse />
        <Nav current={view} onChange={setView} />

        {/* Sound/Theme Toggle - Fixed position */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2"
        >
          <button
            onClick={() => { toggleSound(); play('click'); }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-gray-500 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-gray-500 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => { setShowAIChat(true); play('open'); }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-gray-500 hover:text-white transition-colors"
            title="Chat with The Oracle"
          >
            ◉
          </button>
        </motion.div>

        {/* Content with smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={{ 
              duration: 0.5, 
              ease: [0.22, 1, 0.36, 1] 
            }}
          >
            {view === "now" && <NowView />}
            {view === "writing" && <WritingView />}
            {view === "work" && <WorkView />}
            {view === "about" && <AboutView />}
            {view === "voices" && <VoicesView />}
          </motion.div>
        </AnimatePresence>

        {/* Focus Mode */}
        <AnimatePresence>
          {showFocus && <FocusMode onClose={() => { setShowFocus(false); play('close'); }} />}
        </AnimatePresence>

        {/* Life in Weeks */}
        <AnimatePresence>
          {showLifeWeeks && <LifeInWeeks onClose={() => { setShowLifeWeeks(false); play('close'); }} />}
        </AnimatePresence>

        {/* Easter Egg */}
        <AnimatePresence>
          {showEasterEgg && <EasterEgg onClose={() => { setShowEasterEgg(false); play('close'); }} />}
        </AnimatePresence>

        {/* Hidden Terminal */}
        <AnimatePresence>
          {showTerminal && <HiddenTerminal onClose={() => { setShowTerminal(false); play('close'); }} />}
        </AnimatePresence>

        {/* AI Chat */}
        <AnimatePresence>
          {showAIChat && <AIChat onClose={() => { setShowAIChat(false); play('close'); }} />}
        </AnimatePresence>

        {/* Keyboard Shortcuts */}
        <AnimatePresence>
          {showShortcuts && <KeyboardShortcuts onClose={() => { setShowShortcuts(false); play('close'); }} />}
        </AnimatePresence>

        {/* Keyboard hint - hidden on mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
          className="fixed bottom-6 right-6 text-[9px] text-gray-600 tracking-widest z-40 hidden sm:flex items-center gap-4"
        >
          <span className="text-gray-500">~</span> terminal ·
          <span className="text-gray-500">C</span> chat ·
          <span className="text-gray-500">?</span> shortcuts
        </motion.div>
      </main>
    </>
  );
}
