"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import Nav from "@/components/Nav";
import LoadingScreen from "@/components/LoadingScreen";

// ═══════════════════════════════════════════════════════════════════
// CORE UTILITIES & HOOKS - Reusable across all views
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

// Time awareness hook
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

  const currentPhase = phase || "day";
  return { phase: currentPhase, ...atmosphere[currentPhase] };
}

// Life progress hook
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

// Countdown to tomorrow with midnight callback
function useCountdownToTomorrow(onMidnight?: () => void) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const midnightCalledRef = useRef(false);
  
  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
      
      // Trigger midnight callback when countdown reaches 0
      if (hours === 0 && minutes === 0 && seconds === 0 && !midnightCalledRef.current) {
        midnightCalledRef.current = true;
        onMidnight?.();
        // Reset after 2 seconds so it can trigger again next midnight
        setTimeout(() => {
          midnightCalledRef.current = false;
        }, 2000);
      }
    };
    
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [onMidnight]);
  
  return timeLeft;
}

// Lunar Phase hook
function useLunarPhase() {
  const [phase, setPhase] = useState({ name: "New Moon", emoji: "🌑", illumination: 0, mounted: false });
  
  useEffect(() => {
    const now = new Date();
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

// Mouse parallax
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

// Scroll depth
function useScrollDepth() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });
  return smoothProgress;
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

const DUMMY_VOTES: Record<number, number> = {
  1: 47, 2: 89, 3: 156, 4: 34, 5: 72, 6: 45, 7: 28, 8: 61, 9: 38, 10: 93,
  11: 25, 12: 41, 13: 19, 14: 55, 15: 67, 16: 82, 17: 31, 18: 44, 19: 110, 20: 58,
};

// Hook for questions system with CMS support
function useQuestions(cmsQuestions?: Array<{ id: number; text: string }>) {
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [userVotes, setUserVotes] = useState<number[]>([]);
  const [todayQuestionIndex, setTodayQuestionIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use CMS questions if provided, otherwise fallback
  const questions = cmsQuestions && cmsQuestions.length > 0 ? cmsQuestions : EXISTENTIAL_QUESTIONS;
  const questionsKey = questions.map(q => q.id).join(',');

  // Initialize votes once when questions are available
  useEffect(() => {
    if (isInitialized && questions.length > 0) return;
    
    const savedVotes = localStorage.getItem("contemplation-votes");
    const savedUserVotes = localStorage.getItem("contemplation-user-votes");
    
    // Initialize votes: use saved votes or generate random for new questions
    if (savedVotes) {
      const parsed = JSON.parse(savedVotes);
      // Merge saved votes with new questions that don't have votes yet
      const mergedVotes: Record<number, number> = { ...parsed };
      questions.forEach(q => {
        if (!(q.id in mergedVotes)) {
          mergedVotes[q.id] = Math.floor(Math.random() * 150) + 20;
        }
      });
      setVotes(mergedVotes);
      localStorage.setItem("contemplation-votes", JSON.stringify(mergedVotes));
    } else {
      // Generate initial random votes for all questions
      const initialVotes: Record<number, number> = {};
      questions.forEach(q => {
        initialVotes[q.id] = Math.floor(Math.random() * 150) + 20;
      });
      setVotes(initialVotes);
      localStorage.setItem("contemplation-votes", JSON.stringify(initialVotes));
    }
    
    if (savedUserVotes) setUserVotes(JSON.parse(savedUserVotes));
    
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    setTodayQuestionIndex(dayOfYear % questions.length);
    setIsInitialized(true);
  }, [questionsKey, isInitialized, questions]);

  const todayQuestion = questions[todayQuestionIndex] || questions[0];

  const vote = (questionId: number) => {
    if (userVotes.includes(questionId)) return;
    
    const newVotes = { ...votes, [questionId]: (votes[questionId] || 0) + 1 };
    const newUserVotes = [...userVotes, questionId];
    
    setVotes(newVotes);
    setUserVotes(newUserVotes);
    
    localStorage.setItem("contemplation-votes", JSON.stringify(newVotes));
    localStorage.setItem("contemplation-user-votes", JSON.stringify(newUserVotes));
  };

  const sortedQuestions = [...questions].sort(
    (a, b) => (votes[b.id] || 0) - (votes[a.id] || 0)
  );

  return {
    todayQuestion,
    allQuestions: questions,
    sortedQuestions,
    votes,
    userVotes,
    vote,
  };
}

// Daily intentions - Stoic practices
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

// ═══════════════════════════════════════════════════════════════════
// ZEN MODE OVERLAY - Genius Meditation Experience
// ═══════════════════════════════════════════════════════════════════

interface ZenModeProps {
  question: string;
  countdown: { hours: number; minutes: number; seconds: number };
  onClose: () => void;
}

function ZenModeOverlay({ question, countdown, onClose }: ZenModeProps) {
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [phaseTime, setPhaseTime] = useState(4);
  const [revealedWords, setRevealedWords] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isFullyRevealed, setIsFullyRevealed] = useState(false);
  
  const words = question.split(' ');

  // Mouse parallax
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // Box breathing cycle (4-4-4-4)
  useEffect(() => {
    const phases: Array<'inhale' | 'hold1' | 'exhale' | 'hold2'> = ['inhale', 'hold1', 'exhale', 'hold2'];
    let currentIndex = 0;
    let timeLeft = 4;

    const timer = setInterval(() => {
      timeLeft--;
      setPhaseTime(timeLeft);
      
      if (timeLeft <= 0) {
        currentIndex = (currentIndex + 1) % 4;
        setBreathPhase(phases[currentIndex]);
        timeLeft = 4;
        setPhaseTime(4);
        
        if (currentIndex === 0) {
          setBreathCount(prev => prev + 1);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Progressive word reveal - one word per breath cycle
  useEffect(() => {
    if (breathCount > 0 && revealedWords < words.length) {
      setRevealedWords(breathCount);
    }
    if (breathCount >= words.length) {
      setIsFullyRevealed(true);
    }
  }, [breathCount, words.length, revealedWords]);

  // Keyboard to close or reveal/reset
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'z' || e.key === 'Z') {
        onClose();
      }
      if (e.key === 'g' || e.key === 'G') {
        if (isFullyRevealed) {
          // Reset back to zen mode - start breathing again
          setRevealedWords(0);
          setIsFullyRevealed(false);
          setBreathCount(0);
          setBreathPhase('inhale');
          setPhaseTime(4);
        } else {
          // Instantly reveal all words
          setRevealedWords(words.length);
          setIsFullyRevealed(true);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, words.length, isFullyRevealed]);

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return 'breathe in';
      case 'hold1': return 'hold';
      case 'exhale': return 'breathe out';
      case 'hold2': return 'hold';
    }
  };

  const getBreathScale = () => {
    switch (breathPhase) {
      case 'inhale': return 1 + (4 - phaseTime) * 0.1;
      case 'hold1': return 1.4;
      case 'exhale': return 1.4 - (4 - phaseTime) * 0.1;
      case 'hold2': return 1;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[90] overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a]"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Ambient particle field - reacts to mouse */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => {
          const baseX = (i % 6) * 20;
          const baseY = Math.floor(i / 6) * 20;
          return (
            <motion.div
              key={i}
              className="absolute w-px h-px rounded-full"
              style={{
                backgroundColor: 'var(--accent-gold)',
                left: `${baseX + 10}%`,
                top: `${baseY + 10}%`,
              }}
              animate={{
                x: (mousePos.x - 0.5) * (30 + i * 2),
                y: (mousePos.y - 0.5) * (30 + i * 2),
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.5, 1],
              }}
              transition={{
                x: { duration: 0.3, ease: "easeOut" },
                y: { duration: 0.3, ease: "easeOut" },
                opacity: { duration: 3 + i * 0.2, repeat: Infinity },
                scale: { duration: 3 + i * 0.2, repeat: Infinity },
              }}
            />
          );
        })}
      </div>

      {/* Gradient orbs - ambient light */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(201, 162, 39, 0.08) 0%, transparent 70%)',
          left: '50%',
          top: '50%',
          x: '-50%',
          y: '-50%',
        }}
        animate={{
          scale: getBreathScale(),
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
      />

      {/* Exit hint - minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 2 }}
        className="fixed top-6 right-6 z-10"
      >
        <div className="flex items-center gap-4 text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
          <span className="opacity-50">press</span>
          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>G</span>
          <span className="opacity-50">{isFullyRevealed ? 'zen' : 'reveal'}</span>
          <span className="mx-2 opacity-30">|</span>
          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>ESC</span>
          <span className="opacity-50">exit</span>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center px-8">
        
        {/* Breathing guide circle */}
        <AnimatePresence>
          {!isFullyRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              {/* Outer breathing ring */}
              <motion.div
                className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full"
                style={{
                  border: '1px solid var(--accent-gold)',
                  opacity: 0.3,
                }}
                animate={{
                  scale: getBreathScale(),
                }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
              
              {/* Inner ring */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full"
                style={{
                  border: '1px solid var(--accent-gold)',
                  opacity: 0.5,
                }}
                animate={{
                  scale: getBreathScale() * 0.8,
                }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />

              {/* Center dot */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--accent-gold)' }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question - progressive reveal */}
        <motion.div
          className="relative z-10 max-w-4xl text-center"
          style={{
            transform: `translateX(${(mousePos.x - 0.5) * 20}px) translateY(${(mousePos.y - 0.5) * 20}px)`,
            transition: 'transform 0.5s ease-out',
          }}
        >
          <p className="text-3xl sm:text-5xl lg:text-6xl font-extralight leading-[1.3] tracking-tight">
            {words.map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{
                  opacity: index < revealedWords || isFullyRevealed ? 1 : 0.1,
                  y: index < revealedWords || isFullyRevealed ? 0 : 10,
                  filter: index < revealedWords || isFullyRevealed ? 'blur(0px)' : 'blur(4px)',
                }}
                transition={{ 
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ 
                  color: index < revealedWords || isFullyRevealed 
                    ? 'var(--text-primary)' 
                    : 'var(--text-muted)',
                  display: 'inline-block',
                  marginRight: '0.3em',
                }}
              >
                {word}
              </motion.span>
            ))}
          </p>
        </motion.div>

        {/* Breath instruction - only show while not fully revealed */}
        <AnimatePresence>
          {!isFullyRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-32 sm:bottom-40 text-center"
            >
              <motion.p
                key={breathPhase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg sm:text-xl font-light tracking-[0.2em] uppercase"
                style={{ color: 'var(--accent-gold)', opacity: 0.7 }}
              >
                {getBreathInstruction()}
              </motion.p>
              
              {/* Phase timer dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {[1, 2, 3, 4].map((dot) => (
                  <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ 
                      backgroundColor: dot <= (4 - phaseTime + 1) 
                        ? 'var(--accent-gold)' 
                        : 'var(--bg-tertiary)',
                    }}
                    animate={{
                      scale: dot === (4 - phaseTime + 1) ? [1, 1.5, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar - minimal stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 left-0 right-0 flex items-center justify-center gap-8 text-[10px] tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="flex items-center gap-2">
          <span className="opacity-50">breaths</span>
          <span className="font-mono tabular-nums" style={{ color: 'var(--accent-gold)' }}>
            {breathCount}
          </span>
        </div>
        
        <div className="w-px h-3 opacity-20" style={{ backgroundColor: 'var(--text-muted)' }} />
        
        <div className="flex items-center gap-2">
          <span className="opacity-50">words</span>
          <span className="font-mono tabular-nums">
            {Math.min(revealedWords, words.length)}/{words.length}
          </span>
        </div>
        
        <div className="w-px h-3 opacity-20" style={{ backgroundColor: 'var(--text-muted)' }} />
        
        <div className="font-mono tabular-nums opacity-50">
          {String(countdown.hours).padStart(2, '0')}:
          {String(countdown.minutes).padStart(2, '0')}:
          {String(countdown.seconds).padStart(2, '0')}
        </div>
        
        <div className="w-px h-3 opacity-20" style={{ backgroundColor: 'var(--text-muted)' }} />
        
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'var(--bg-tertiary)' }}>G</span>
          <span className="opacity-50">{isFullyRevealed ? 'zen' : 'reveal'}</span>
        </div>
      </motion.div>

      {/* Progress indicator - words revealed */}
      <motion.div
        className="fixed bottom-0 left-0 h-px"
        style={{ backgroundColor: 'var(--accent-gold)' }}
        animate={{
          width: `${(Math.min(revealedWords, words.length) / words.length) * 100}%`,
        }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NOW VIEW - NON-CONVENTIONAL GENIUS LAYOUT
// ═══════════════════════════════════════════════════════════════════

function NowView() {
  const { greeting } = useTimeAwareness();
  const { year, week, mounted } = useLifeProgress();
  const { emoji: lunarEmoji, name: lunarName } = useLunarPhase();
  const { x: mouseX, y: mouseY } = useMouseParallax();

  const [todayIntention, setTodayIntention] = useState(DAILY_INTENTIONS[0]);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [isContemplatedModalOpen, setIsContemplatedModalOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [questionRotationKey, setQuestionRotationKey] = useState(0);
  const [showMidnightTransition, setShowMidnightTransition] = useState(false);
  
  // CMS Contemplations state - converted to question format
  const [cmsQuestions, setCmsQuestions] = useState<Array<{ id: number; text: string }>>([]);
  const [featuredQuestionId, setFeaturedQuestionId] = useState<number | null>(null);
  
  // Midnight callback - rotate question when countdown reaches 0
  const handleMidnight = useCallback(() => {
    setShowMidnightTransition(true);
    
    // Refetch contemplations to get updated featured question
    setTimeout(async () => {
      try {
        const res = await fetch("/api/contemplations");
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            const formattedAll = data.map((c: { id: number; question: string }) => ({
              id: c.id,
              text: c.question,
            }));
            setCmsQuestions(formattedAll);
            
            const featured = data.find((c: { featured: boolean }) => c.featured);
            if (featured) {
              setFeaturedQuestionId(featured.id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch new contemplation:", error);
      }
      
      // Force re-render of question hook
      setQuestionRotationKey(prev => prev + 1);
      
      // Hide transition after animation
      setTimeout(() => {
        setShowMidnightTransition(false);
      }, 2000);
    }, 500);
  }, []);
  
  const countdown = useCountdownToTomorrow(handleMidnight);
  
  // Use the hook with CMS questions
  const { 
    todayQuestion: hookTodayQuestion, 
    sortedQuestions,
    votes, 
    userVotes, 
    vote, 
  } = useQuestions(cmsQuestions.length > 0 ? cmsQuestions : undefined);

  // Determine today's question - use featured if available, or rotate based on day
  const todayQuestion = useMemo(() => {
    if (featuredQuestionId) {
      return cmsQuestions.find(q => q.id === featuredQuestionId) || hookTodayQuestion;
    }
    // Use day of year to pick question (changes at midnight)
    if (cmsQuestions.length > 0) {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const index = (dayOfYear + questionRotationKey) % cmsQuestions.length;
      return cmsQuestions[index];
    }
    return hookTodayQuestion;
  }, [featuredQuestionId, cmsQuestions, hookTodayQuestion, questionRotationKey]);
    
  const [selectedQuestion, setSelectedQuestion] = useState(todayQuestion);
  
  // Articles state for writing preview
  const [latestArticles, setLatestArticles] = useState<Array<{ slug: string; title: string; excerpt: string; readTime: string }>>([]);

  // Fetch intentions and contemplations from API
  useEffect(() => {
    async function fetchData() {
      try {
        const [intentionsRes, contemplationsRes, articlesRes] = await Promise.all([
          fetch("/api/intentions"),
          fetch("/api/contemplations"),
          fetch("/api/articles"),
        ]);
        
        // Handle intentions
        if (intentionsRes.ok) {
          const data = await intentionsRes.json();
          if (data.length > 0) {
            const dayIndex = new Date().getDate() % data.length;
            setTodayIntention(data[dayIndex].text);
          } else {
            setTodayIntention(DAILY_INTENTIONS[new Date().getDate() % DAILY_INTENTIONS.length]);
          }
        }
        
        // Handle contemplations
        if (contemplationsRes.ok) {
          const data = await contemplationsRes.json();
          if (data.length > 0) {
            // Convert to same format as EXISTENTIAL_QUESTIONS
            const formattedAll = data.map((c: { id: number; question: string }) => ({
              id: c.id,
              text: c.question,
            }));
            setCmsQuestions(formattedAll);
            
            // Find featured question
            const featured = data.find((c: { featured: boolean }) => c.featured);
            if (featured) {
              setFeaturedQuestionId(featured.id);
            }
          }
        }
        
        // Handle articles - get latest 2
        if (articlesRes.ok) {
          const data = await articlesRes.json();
          setLatestArticles(data.slice(0, 2).map((a: { slug: string; title: string; excerpt: string; readTime: string }) => ({
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
            readTime: a.readTime,
          })));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setTodayIntention(DAILY_INTENTIONS[new Date().getDate() % DAILY_INTENTIONS.length]);
      }
    }
    
    fetchData();
    setHoursLeft(24 - new Date().getHours());
    
    // Auto-refresh: poll every 10 seconds to check for CMS updates
    const refreshInterval = setInterval(fetchData, 10000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Zen Mode keyboard shortcut (Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'z' || e.key === 'Z') {
        setIsZenMode(prev => !prev);
      }
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode]);

  // Update selected question when todayQuestion changes
  useEffect(() => {
    if (todayQuestion) {
      setSelectedQuestion(todayQuestion);
    }
  }, [todayQuestion]);

  const handleSelectQuestion = (q: typeof todayQuestion) => {
    setSelectedQuestion(q);
    setIsAnswerModalOpen(true);
  };

  const daysLeft = mounted ? 365 - Math.floor(year * 3.65) : 0;
  const weeksLeft = mounted ? 52 - week : 0;
  const previousQuestions = sortedQuestions.filter(q => q.id !== todayQuestion.id).slice(0, 2);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Midnight Transition Overlay */}
      <AnimatePresence>
        {showMidnightTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, ease: "linear" }}
                className="text-6xl mb-6"
              >
                ◐
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-light tracking-wider"
                style={{ color: 'var(--accent-gold)' }}
              >
                A new day begins
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm mt-2"
                style={{ color: 'var(--text-muted)' }}
              >
                New contemplation awaits...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient floating particles - subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ 
              backgroundColor: 'var(--accent-gold)',
              opacity: 0.1,
              // Fixed positions based on index to prevent re-render jitter
              left: `${(i * 13 + 5) % 100}%`,
              top: `${(i * 17 + 10) % 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 6 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Container - Asymmetric Grid */}
      <div className="relative min-h-screen grid grid-cols-12 gap-0">
        
        {/* LEFT COLUMN - Philosophical Sidebar (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-2 border-r" style={{ borderColor: 'var(--border-secondary)' }}>
          <div className="sticky top-24 p-6 space-y-12">
            
            {/* Lunar Phase - Circular */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)' 
                }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 var(--accent-gold-dim)',
                    '0 0 0 8px var(--accent-gold-dim)',
                    '0 0 0 0 var(--accent-gold-dim)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-2xl">{lunarEmoji}</span>
              </motion.div>
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
                {lunarName.split(" ")[0]}
              </p>
            </motion.div>

            {/* Time Greeting - Vertical */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <p 
                className="text-[10px] tracking-[0.15em] leading-relaxed"
                style={{ 
                  color: 'var(--text-tertiary)',
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  margin: '0 auto'
                }}
              >
                {greeting}
              </p>
            </motion.div>

            {/* Memento Mori Counter - Vertical */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="space-y-4 text-center"
            >
              <p className="text-[8px] tracking-[0.3em] uppercase" style={{ color: 'var(--accent-gold)', opacity: 0.5 }}>
                memento<br/>mori
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-extralight tabular-nums" style={{ color: 'var(--text-primary)' }}>{hoursLeft}</p>
                  <p className="text-[8px] tracking-wider" style={{ color: 'var(--text-muted)' }}>hours</p>
                </div>
                <div>
                  <p className="text-2xl font-extralight tabular-nums" style={{ color: 'var(--text-primary)' }}>{daysLeft}</p>
                  <p className="text-[8px] tracking-wider" style={{ color: 'var(--text-muted)' }}>days</p>
                </div>
                <div>
                  <p className="text-2xl font-extralight tabular-nums" style={{ color: 'var(--text-primary)' }}>{weeksLeft}</p>
                  <p className="text-[8px] tracking-wider" style={{ color: 'var(--text-muted)' }}>weeks</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* CENTER - Hero Question (Unconventional Scale) */}
        <div className="col-span-12 lg:col-span-7 flex items-center justify-center px-6 sm:px-8 py-24 sm:py-32">
          <div className="w-full max-w-3xl relative">
            
            {/* Today's marker - floating */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -top-16 left-0 flex items-center gap-3"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--accent-gold)' }}
              />
              <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'var(--accent-gold)', opacity: 0.7 }}>
                today's question
              </span>
            </motion.div>

            {/* The Question - HERO TYPOGRAPHY */}
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <span 
                className="block text-[2rem] sm:text-[2.5rem] lg:text-[3.5rem] font-extralight leading-[1.1] tracking-tight"
                style={{ 
                  color: 'var(--text-primary)',
                  textShadow: '0 0 40px var(--accent-gold-dim)'
                }}
              >
                {todayQuestion.text}
              </span>
              
              {/* Decorative accent line */}
              <motion.div
                className="absolute -left-4 top-0 bottom-0 w-px"
                style={{ background: 'linear-gradient(to bottom, transparent, var(--accent-gold), transparent)' }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              />
            </motion.h1>

            {/* Floating Action Buttons - Unconventional positioning */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              {/* Vote Button - with live count */}
              <motion.button
                onClick={() => vote(todayQuestion.id)}
                disabled={userVotes.includes(todayQuestion.id)}
                className="group relative"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="flex items-center gap-4 px-6 py-4 rounded-lg transition-all"
                  style={{
                    backgroundColor: userVotes.includes(todayQuestion.id) ? 'var(--accent-gold-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${userVotes.includes(todayQuestion.id) ? 'var(--accent-gold)' : 'var(--border-primary)'}`,
                  }}
                >
                  <span className="text-lg">
                    ▲
                  </span>
                  <div className="text-left">
                    <p className="text-2xl font-light tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {votes[todayQuestion.id] || 0}
                    </p>
                    <p className="text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                      {userVotes.includes(todayQuestion.id) ? 'voted' : 'vote'}
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Answer Button */}
              <motion.button
                onClick={() => setIsAnswerModalOpen(true)}
                className="group flex items-center gap-3 px-6 py-4 rounded-lg transition-all"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                }}
                whileHover={{ 
                  scale: 1.02,
                  borderColor: 'var(--accent-gold)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
                  share your answer
                </span>
                <span style={{ color: 'var(--accent-gold)' }}>
                  →
                </span>
              </motion.button>
            </motion.div>

            {/* Today's Intention - floating thought bubble */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="mt-16 sm:mt-24 relative"
            >
              <div 
                className="px-6 py-4 rounded-lg max-w-md"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-secondary)',
                }}
              >
                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  "{todayIntention}"
                </p>
              </div>
              {/* Connection line */}
              <div 
                className="absolute -top-8 left-8 w-px h-8"
                style={{ 
                  background: 'linear-gradient(to bottom, var(--border-secondary), transparent)',
                  opacity: 0.5 
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* RIGHT COLUMN - Secondary Info (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-3 border-l" style={{ borderColor: 'var(--border-secondary)' }}>
          <div className="sticky top-24 p-6 space-y-8">
            
            {/* Countdown Timer - Digital */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <p className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                next contemplation
              </p>
              <div 
                className="px-4 py-3 rounded font-mono text-xl tabular-nums relative overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)' 
                }}
              >
                {/* Progress bar showing time passed today */}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5"
                  style={{ backgroundColor: 'var(--accent-gold)', opacity: 0.5 }}
                  animate={{
                    width: `${((24 - countdown.hours - 1) / 24) * 100}%`,
                  }}
                  transition={{ duration: 1 }}
                />
                {String(countdown.hours).padStart(2, '0')}:
                {String(countdown.minutes).padStart(2, '0')}:
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {String(countdown.seconds).padStart(2, '0')}
                </motion.span>
              </div>
              <p className="text-[8px] mt-2 opacity-60" style={{ color: 'var(--text-muted)' }}>
                Question rotates at midnight
              </p>
            </motion.div>

            {/* Previously Contemplated */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <button 
                onClick={() => setIsContemplatedModalOpen(true)}
                className="flex items-center gap-2 mb-4 group"
              >
                <p className="text-[9px] tracking-[0.2em] uppercase group-hover:opacity-80 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                  contemplated
                </p>
                <span className="text-[10px]" style={{ color: 'var(--accent-gold)', opacity: 0.6 }}>
                  →
                </span>
              </button>
              <div className="space-y-4">
                {previousQuestions.map((q, i) => (
                  <motion.button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className="w-full text-left group"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    whileHover={{ x: -4 }}
                  >
                    <div className="flex items-start gap-3">
                      <span 
                        className="text-[10px] tabular-nums mt-1 flex-shrink-0"
                        style={{ 
                          color: userVotes.includes(q.id) ? 'var(--accent-gold)' : 'var(--text-muted)' 
                        }}
                      >
                        ▲{votes[q.id] || 0}
                      </span>
                      <p 
                        className="text-sm leading-relaxed group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--text-tertiary)', opacity: 0.7 }}
                      >
                        {q.text}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
              
              {/* View all button */}
              <motion.button
                onClick={() => setIsContemplatedModalOpen(true)}
                className="mt-4 text-xs tracking-wider flex items-center gap-1 group"
                style={{ color: 'var(--text-muted)' }}
                whileHover={{ x: 2 }}
              >
                <span className="group-hover:underline">view all {sortedQuestions.length}</span>
                <span style={{ color: 'var(--accent-gold)' }}>→</span>
              </motion.button>
            </motion.div>

            {/* Latest Writings Preview */}
            {latestArticles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="pt-8"
                style={{ borderTop: '1px solid var(--border-secondary)' }}
              >
                <Link 
                  href="/?view=writing"
                  className="flex items-center gap-2 mb-4 group"
                >
                  <span 
                    className="text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    latest writings
                  </span>
                  <span 
                    className="text-xs transition-transform group-hover:translate-x-1"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    →
                  </span>
                </Link>
                
                <div className="space-y-4">
                  {latestArticles.map((article, index) => (
                    <Link 
                      key={article.slug} 
                      href={`/writing/${article.slug}`}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 + index * 0.1 }}
                        className="group cursor-pointer"
                      >
                        <h4 
                          className="text-sm font-light leading-relaxed transition-colors group-hover:text-[var(--accent-gold)]"
                          style={{ 
                            color: 'var(--text-secondary)',
                            fontFamily: "'EB Garamond', Georgia, serif"
                          }}
                        >
                          {article.title}
                        </h4>
                        <p 
                          className="text-[10px] mt-1 line-clamp-2"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {article.excerpt}
                        </p>
                        <span 
                          className="text-[9px] mt-1 inline-block"
                          style={{ color: 'var(--text-muted)', opacity: 0.6 }}
                        >
                          {article.readTime}
                        </span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Signature */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="pt-8"
              style={{ borderTop: '1px solid var(--border-secondary)' }}
            >
              <p className="text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Juan Maulana
              </p>
              <p className="text-[8px] tracking-wide mt-1" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                Contemplating daily
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Desktop: Footer with shortcut hint */}
      <motion.div 
        className="hidden lg:block fixed bottom-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isZenMode ? 0 : 1, y: isZenMode ? 10 : 0 }}
        transition={{ delay: 1.5 }}
      >
        <button
          onClick={() => setIsZenMode(true)}
          className="flex items-center gap-3 px-4 py-2 rounded-full transition-all hover:scale-105"
          style={{ 
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-secondary)',
          }}
        >
          <span className="text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
            press
          </span>
          <span 
            className="px-2 py-0.5 rounded text-[10px] font-mono"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            Z
          </span>
          <span className="text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
            for zen mode
          </span>
        </button>
      </motion.div>

      {/* Mobile: Compact footer with essentials */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-secondary)' }}>
        <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <span>{lunarEmoji}</span>
            <span className="tracking-wider">{hoursLeft}h left</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsZenMode(true)}
              className="px-2 py-1 rounded"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              zen
            </button>
            <div className="font-mono tabular-nums">
              {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* Zen Mode Overlay - Genius Edition */}
      <AnimatePresence>
        {isZenMode && (
          <ZenModeOverlay 
            question={todayQuestion.text}
            countdown={countdown}
            onClose={() => setIsZenMode(false)}
          />
        )}
      </AnimatePresence>

      {/* Answer Writer Modal with Focus Mode */}
      <AnswerWriterModal 
        isOpen={isAnswerModalOpen}
        onClose={() => setIsAnswerModalOpen(false)}
        question={selectedQuestion.text}
      />

      {/* Contemplated Modal - All Questions */}
      <ContemplatedModal
        isOpen={isContemplatedModalOpen}
        onClose={() => setIsContemplatedModalOpen(false)}
        questions={sortedQuestions}
        votes={votes}
        userVotes={userVotes}
        onVote={vote}
        onSelectQuestion={handleSelectQuestion}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANSWER WRITER MODAL - iA Writer Inspired Focus Mode
// ═══════════════════════════════════════════════════════════════════

interface AnswerWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
}

function AnswerWriterModal({ isOpen, onClose, question }: AnswerWriterModalProps) {
  const [answer, setAnswer] = useState("");
  const [focusMode, setFocusMode] = useState(true);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    const words = answer.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    setCharCount(answer.length);
    setReadTime(Math.ceil(words.length / 200)); // 200 wpm reading speed
  }, [answer]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  const handleSelect = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // iA Writer style: focus on current sentence (dim everything else)
  const renderFocusText = () => {
    if (!focusMode || !answer) return null;
    
    // Split into sentences for better focus
    const parts = answer.split(/(\s+)/);
    let runningLength = 0;
    
    return parts.map((part, index) => {
      const partStart = runningLength;
      const partEnd = runningLength + part.length;
      runningLength += part.length;
      
      // Calculate distance from cursor
      const distanceFromCursor = Math.min(
        Math.abs(cursorPosition - partStart),
        Math.abs(cursorPosition - partEnd)
      );
      
      // iA Writer style: focused area is 40 chars around cursor
      const focusRange = 40;
      let opacity = 0.2;
      
      if (distanceFromCursor <= focusRange) {
        // Smooth gradient from full opacity to dim
        opacity = 1 - (distanceFromCursor / focusRange) * 0.8;
      }
      
      return (
        <span 
          key={index}
          style={{ 
            opacity,
            transition: 'opacity 0.15s ease-out',
          }}
        >
          {part}
        </span>
      );
    });
  };

  const handleSave = async () => {
    if (!answer.trim() || !authorName.trim()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const colors = ['gold', 'sage', 'stone', 'amber', 'bronze'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer: answer.trim(),
          author: authorName.trim(),
          color: randomColor,
        }),
      });
      
      if (res.ok) {
        setSubmitStatus('success');
        // Wait for user to see success message before closing
        setTimeout(() => {
          onClose();
          setAnswer("");
          setAuthorName("");
          setSubmitStatus('idle');
        }, 2500);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100]"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* iA Writer style: Minimal top bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="fixed top-0 left-0 right-0 z-10"
        >
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Close button - minimal */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm transition-opacity hover:opacity-100"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            >
              <span>←</span>
              <span className="hidden sm:inline">esc to close</span>
            </button>
            
            {/* Focus mode indicator */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs tracking-wider uppercase transition-all"
              style={{ 
                backgroundColor: focusMode ? 'var(--accent-gold-dim)' : 'transparent',
                color: focusMode ? 'var(--accent-gold)' : 'var(--text-muted)',
                border: focusMode ? '1px solid var(--accent-gold)' : '1px solid transparent',
                opacity: focusMode ? 1 : 0.6,
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: focusMode ? 'var(--accent-gold)' : 'var(--text-muted)' }}
                animate={focusMode ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span>Focus</span>
            </button>
          </div>
        </motion.div>

        {/* Main writing area - centered like iA Writer */}
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
          <div className="w-full max-w-2xl">
            
            {/* Question prompt - subtle, above */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12 text-center"
            >
              <p 
                className="text-xs tracking-[0.2em] uppercase mb-3"
                style={{ color: 'var(--accent-gold)', opacity: 0.7 }}
              >
                contemplating
              </p>
              <h1 
                className="text-xl sm:text-2xl font-light leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {question}
              </h1>
            </motion.div>

            {/* Writing area */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative min-h-[50vh]"
            >
              {/* Focus mode overlay text - iA Writer style typography */}
              {focusMode && answer && (
                <div 
                  className="absolute inset-0 pointer-events-none leading-[1.8] text-xl sm:text-2xl"
                  style={{ 
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {renderFocusText()}
                </div>
              )}

              {/* Actual textarea */}
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={handleTextChange}
                onKeyUp={handleKeyUp}
                onSelect={handleSelect}
                onClick={handleSelect}
                placeholder="Begin writing..."
                className="w-full min-h-[50vh] bg-transparent border-none outline-none resize-none leading-[1.8] text-xl sm:text-2xl"
                style={{ 
                  color: focusMode && answer ? 'transparent' : 'var(--text-primary)',
                  caretColor: 'var(--accent-gold)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.01em',
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Bottom bar - iA Writer style stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          {/* Success Message Overlay */}
          <AnimatePresence>
            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="text-4xl mb-3"
                  >
                    ✓
                  </motion.div>
                  <p className="text-sm" style={{ color: 'var(--accent-gold)' }}>
                    Your reflection has been submitted
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Pending approval before appearing on the Board of Collective
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 text-center py-2 text-xs"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                Failed to submit. Please try again.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Stats - left side */}
            <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1.5">
                <span className="font-mono tabular-nums text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {wordCount}
                </span>
                <span className="opacity-60">words</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono tabular-nums text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {charCount}
                </span>
                <span className="opacity-60">chars</span>
              </div>
              {readTime > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono tabular-nums text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {readTime}
                  </span>
                  <span className="opacity-60">min read</span>
                </div>
              )}
            </div>

            {/* Author input & Save button - right side */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                className="px-3 py-1.5 rounded-lg text-sm bg-transparent outline-none"
                style={{ 
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)',
                  width: '140px',
                }}
              />
              <motion.button
                onClick={handleSave}
                disabled={!answer.trim() || !authorName.trim() || isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm transition-all disabled:opacity-30"
                style={{ 
                  backgroundColor: answer.trim() && authorName.trim() ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                  color: answer.trim() && authorName.trim() ? 'var(--bg-primary)' : 'var(--text-muted)',
                }}
                whileHover={answer.trim() && authorName.trim() ? { scale: 1.02 } : {}}
                whileTap={answer.trim() && authorName.trim() ? { scale: 0.98 } : {}}
              >
                {isSubmitting ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ◐
                  </motion.span>
                ) : (
                  <>
                    <span>Share</span>
                    <span>→</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Typing indicator line - iA Writer style */}
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 w-px h-6"
          style={{ 
            backgroundColor: 'var(--accent-gold)',
            bottom: '80px',
            opacity: 0.3,
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CONTEMPLATED MODAL - All Questions List
// ═══════════════════════════════════════════════════════════════════

interface ContemplatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: typeof EXISTENTIAL_QUESTIONS;
  votes: Record<number, number>;
  userVotes: number[];
  onVote: (id: number) => void;
  onSelectQuestion: (question: typeof EXISTENTIAL_QUESTIONS[0]) => void;
}

function ContemplatedModal({ 
  isOpen, 
  onClose, 
  questions, 
  votes, 
  userVotes, 
  onVote,
  onSelectQuestion 
}: ContemplatedModalProps) {
  const sortedQuestions = [...questions].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  
  // Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="px-6 py-5 border-b flex items-center justify-between sticky top-0"
            style={{ 
              borderColor: 'var(--border-secondary)',
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            <div>
              <h2 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
                All Questions
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {questions.length} questions • Sorted by contemplations
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
              }}
            >
              ✕
            </button>
          </div>

          {/* Questions List */}
          <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
            <div className="p-4 space-y-2">
              {sortedQuestions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group"
                >
                  <div 
                    className="flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer"
                    style={{ 
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onClick={() => {
                      onSelectQuestion(q);
                      onClose();
                    }}
                  >
                    {/* Rank number */}
                    <div 
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono"
                      style={{ 
                        backgroundColor: index < 3 ? 'var(--accent-gold-dim)' : 'var(--bg-primary)',
                        color: index < 3 ? 'var(--accent-gold)' : 'var(--text-muted)',
                      }}
                    >
                      {index + 1}
                    </div>

                    {/* Question content */}
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-sm leading-relaxed mb-2 group-hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {q.text}
                      </p>
                      
                      {/* Meta info */}
                      <div className="flex items-center gap-4">
                        <span 
                          className="text-xs font-mono tabular-nums"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {votes[q.id] || 0} contemplations
                        </span>
                        
                        {userVotes.includes(q.id) && (
                          <span 
                            className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: 'var(--accent-gold-dim)',
                              color: 'var(--accent-gold)',
                            }}
                          >
                            voted
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Vote button */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVote(q.id);
                      }}
                      disabled={userVotes.includes(q.id)}
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                      style={{ 
                        backgroundColor: userVotes.includes(q.id) ? 'var(--accent-gold-dim)' : 'var(--bg-primary)',
                        color: userVotes.includes(q.id) ? 'var(--accent-gold)' : 'var(--text-muted)',
                        border: `1px solid ${userVotes.includes(q.id) ? 'var(--accent-gold)' : 'var(--border-primary)'}`,
                      }}
                      whileHover={!userVotes.includes(q.id) ? { scale: 1.05 } : {}}
                      whileTap={!userVotes.includes(q.id) ? { scale: 0.95 } : {}}
                    >
                      ▲
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WRITING VIEW - Articles & Thoughts (now fetches from API)
// ═══════════════════════════════════════════════════════════════════

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
}

const STOIC_QUOTES_FALLBACK = [
  { text: "You have power over your mind - not outside events.", author: "Marcus Aurelius", source: "Meditations VI.32" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", source: "Meditations V.20" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", source: "Meditations X.16" },
  { text: "He who fears death will never do anything worthy of a living man.", author: "Seneca", source: "Letters 82" },
];

function WritingView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [quotes, setQuotes] = useState(STOIC_QUOTES_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [typewriterText, setTypewriterText] = useState("");
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Get random quote index based on current hour (changes every hour)
  const getHourlyRandomIndex = useCallback((quotesLength: number) => {
    if (quotesLength === 0) return 0;
    const now = new Date();
    // Create a seed from year, month, day, and hour
    const seed = now.getFullYear() * 1000000 + 
                 (now.getMonth() + 1) * 10000 + 
                 now.getDate() * 100 + 
                 now.getHours();
    // Simple hash to get pseudo-random but consistent index for the hour
    return seed % quotesLength;
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [articlesRes, quotesRes] = await Promise.all([
          fetch("/api/articles"),
          fetch("/api/quotes"),
        ]);
        
        if (articlesRes.ok) {
          const data = await articlesRes.json();
          setArticles(data);
        }
        
        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          if (quotesData.length > 0) {
            setQuotes(quotesData);
            // Set initial random index based on hour
            setCurrentQuoteIndex(getHourlyRandomIndex(quotesData.length));
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    
    // Auto-refresh: poll every 10 seconds to check for CMS updates
    const refreshInterval = setInterval(fetchData, 10000);
    return () => clearInterval(refreshInterval);
  }, [getHourlyRandomIndex]);

  // Update quote every hour
  useEffect(() => {
    if (quotes.length === 0) return;
    
    // Calculate time until next hour
    const now = new Date();
    const msUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;
    
    // Set timeout for next hour change
    const timeout = setTimeout(() => {
      setCurrentQuoteIndex(getHourlyRandomIndex(quotes.length));
      
      // Then set interval for every hour after that
      const interval = setInterval(() => {
        setCurrentQuoteIndex(getHourlyRandomIndex(quotes.length));
      }, 60 * 60 * 1000); // Every hour
      
      return () => clearInterval(interval);
    }, msUntilNextHour);
    
    return () => clearTimeout(timeout);
  }, [quotes.length, getHourlyRandomIndex]);
  
  const currentQuote = quotes[currentQuoteIndex];
  const fullText = currentQuote?.text || "";

  useEffect(() => {
    if (!fullText) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypewriterText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [fullText]);

  const featured = articles.find(a => a.featured);
  const others = articles.filter(a => !a.featured);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen px-4 sm:px-6 py-24 sm:py-32">
      <div className="max-w-6xl mx-auto">
        
        {/* Typewriter Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16 sm:mb-24"
        >
          <div className="max-w-3xl">
            <p className="text-xl sm:text-2xl font-light leading-relaxed mb-4 font-mono" style={{ color: 'var(--text-secondary)' }}>
              {typewriterText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-px h-6 ml-1"
                style={{ backgroundColor: 'var(--accent-gold)' }}
              />
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              — {currentQuote?.author}, <span className="italic">{currentQuote?.source}</span>
            </p>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-8 mb-12 pb-6"
          style={{ borderBottom: '1px solid var(--border-secondary)' }}
        >
          <div>
            <p className="text-3xl font-light" style={{ color: 'var(--text-primary)' }}>{articles.length}</p>
            <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>essays</p>
          </div>
          <div>
            <p className="text-3xl font-light" style={{ color: 'var(--text-primary)' }}>
              {articles.reduce((acc, a) => acc + parseInt(a.readTime), 0)}
            </p>
            <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>min read</p>
          </div>
          <div>
            <p className="text-3xl font-light" style={{ color: 'var(--text-primary)' }}>∞</p>
            <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>thoughts</p>
          </div>
        </motion.div>

        {/* Featured Article */}
        {featured && (
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16 sm:mb-24 group"
          >
            <Link href={`/writing/${featured.slug}`}>
              <div 
                className="p-8 sm:p-12 rounded-xl transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                style={{ 
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--accent-gold)' }}>
                    featured
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-secondary)' }} />
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-light mb-4 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                  {featured.title}
                </h2>
                
                <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {featured.excerpt}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>{featured.date}</span>
                  <span>•</span>
                  <span>{featured.readTime} read</span>
                  <span>•</span>
                  <div className="flex gap-2">
                    {featured.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </motion.article>
        )}

        {/* Other Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {others.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="group"
            >
              <Link href={`/writing/${article.slug}`}>
                <div 
                  className="p-6 rounded-lg h-full transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{ 
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  <h3 className="text-xl font-light mb-3 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                    {article.title}
                  </h3>
                  
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {article.excerpt}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WORK VIEW - Projects & Contributions (now fetches from API)
// ═══════════════════════════════════════════════════════════════════

interface Project {
  id: number;
  slug: string;
  title: string;
  description: string;
  tech: string[];
  year: string;
  status: string;
  featured?: boolean;
}

function WorkView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState(STOIC_QUOTES_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [typewriterText, setTypewriterText] = useState("");
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Get random quote index based on current hour (changes every hour)
  // Use a different seed offset for Work section so it shows different quote than Writing
  const getHourlyRandomIndex = useCallback((quotesLength: number) => {
    if (quotesLength === 0) return 0;
    const now = new Date();
    // Create a seed from year, month, day, and hour + offset for different section
    const seed = now.getFullYear() * 1000000 + 
                 (now.getMonth() + 1) * 10000 + 
                 now.getDate() * 100 + 
                 now.getHours() + 42; // offset to show different quote than Writing
    // Simple hash to get pseudo-random but consistent index for the hour
    return seed % quotesLength;
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, quotesRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/quotes"),
        ]);
        
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data);
        }
        
        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          if (quotesData.length > 0) {
            setQuotes(quotesData);
            setCurrentQuoteIndex(getHourlyRandomIndex(quotesData.length));
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    
    // Auto-refresh: poll every 10 seconds to check for CMS updates
    const refreshInterval = setInterval(fetchData, 10000);
    return () => clearInterval(refreshInterval);
  }, [getHourlyRandomIndex]);

  // Update quote every hour
  useEffect(() => {
    if (quotes.length === 0) return;
    
    const now = new Date();
    const msUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;
    
    const timeout = setTimeout(() => {
      setCurrentQuoteIndex(getHourlyRandomIndex(quotes.length));
      
      const interval = setInterval(() => {
        setCurrentQuoteIndex(getHourlyRandomIndex(quotes.length));
      }, 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }, msUntilNextHour);
    
    return () => clearTimeout(timeout);
  }, [quotes.length, getHourlyRandomIndex]);

  const currentQuote = quotes[currentQuoteIndex];
  const fullText = currentQuote?.text || "";

  useEffect(() => {
    if (!fullText) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypewriterText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [fullText]);

  // Generate contribution data (52 weeks)
  const generateContributions = () => {
    const weeks = 52;
    const data: number[][] = [];
    for (let week = 0; week < weeks; week++) {
      const days: number[] = [];
      for (let day = 0; day < 7; day++) {
        days.push(Math.floor(Math.random() * 5));
      }
      data.push(days);
    }
    return data;
  };

  const [contributions] = useState(generateContributions());
  
  const getContributionColor = (level: number) => {
    const colors = [
      'var(--bg-elevated)',
      'rgba(201, 162, 39, 0.2)',
      'rgba(201, 162, 39, 0.4)',
      'rgba(201, 162, 39, 0.6)',
      'rgba(201, 162, 39, 0.8)',
    ];
    return colors[level] || colors[0];
  };

  const featured = projects.find(p => p.featured);
  const others = projects.filter(p => !p.featured);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen px-4 sm:px-6 py-24 sm:py-32">
      <div className="max-w-6xl mx-auto">
        
        {/* Typewriter Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16 sm:mb-24"
        >
          <div className="max-w-3xl">
            <p className="text-xl sm:text-2xl font-light leading-relaxed mb-4 font-mono" style={{ color: 'var(--text-secondary)' }}>
              {typewriterText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-px h-6 ml-1"
                style={{ backgroundColor: 'var(--accent-gold)' }}
              />
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              — {currentQuote?.author}{currentQuote?.source && <>, <span className="italic">{currentQuote.source}</span></>}
            </p>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-8 mb-12 pb-6"
          style={{ borderBottom: '1px solid var(--border-secondary)' }}
        >
          <div>
            <p className="text-3xl font-light" style={{ color: 'var(--text-primary)' }}>{projects.length}</p>
            <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>projects</p>
          </div>
          <div>
            <p className="text-3xl font-light" style={{ color: 'var(--text-primary)' }}>
              {projects.filter(p => p.status === 'Active').length}
            </p>
            <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>active</p>
          </div>
          <div>
            <p className="text-3xl font-light" style={{ color: 'var(--text-primary)' }}>∞</p>
            <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>commits</p>
          </div>
        </motion.div>

        {/* Featured Project */}
        {featured && (
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16 sm:mb-24 group"
          >
            <Link href={`/work/${featured.slug}`}>
              <div 
                className="p-8 sm:p-12 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--accent-gold)' }}>
                    featured
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-secondary)' }} />
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-light mb-4 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                  {featured.title}
                </h2>
                
                <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {featured.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>{featured.year}</span>
                  <span>•</span>
                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--accent-gold-dim)', color: 'var(--accent-gold)' }}>
                    {featured.status}
                  </span>
                  <span>•</span>
                  <div className="flex gap-2">
                    {featured.tech.map(tech => (
                      <span key={tech} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </motion.article>
        )}

        {/* Other Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {others.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="group"
            >
              <Link href={`/work/${project.slug}`}>
                <div 
                  className="p-6 rounded-lg h-full transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{ 
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-light group-hover:opacity-70 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                      {project.title}
                    </h3>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{project.year}</span>
                  </div>
                  
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map(tech => (
                      <span 
                        key={tech} 
                        className="px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* GitHub-style Contribution Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="p-6 sm:p-8 rounded-xl"
          style={{ 
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
              Contribution Activity
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Last 52 weeks
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <div className="inline-flex gap-1">
              {contributions.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((level, dayIndex) => (
                    <motion.div
                      key={`${weekIndex}-${dayIndex}`}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: getContributionColor(level) }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: weekIndex * 0.01 + dayIndex * 0.005 }}
                      whileHover={{ scale: 1.5 }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getContributionColor(level) }}
              />
            ))}
            <span>More</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABOUT VIEW - Bio & Philosophy
// ═══════════════════════════════════════════════════════════════════

function AboutView() {
  const scrollProgress = useScrollDepth();
  const { x: mouseX, y: mouseY } = useMouseParallax();

  return (
    <div className="min-h-screen px-4 sm:px-6 py-24 sm:py-32">
      <div className="max-w-4xl mx-auto">
        
        {/* Hero Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <motion.h1 
            className="text-5xl sm:text-7xl font-extralight mb-8 tracking-tight"
            style={{ 
              color: 'var(--text-primary)',
              transform: `translateX(${mouseX * 10}px) translateY(${mouseY * 10}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          >
            Juan Rizky<br />Maulana
          </motion.h1>
          
          <p className="text-xl sm:text-2xl font-light leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            Developer, writer, and student of Stoic philosophy.
          </p>
          
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            I build tools for contemplation and create spaces for philosophical inquiry. 
            My work explores the intersection of ancient wisdom and modern technology.
          </p>
        </motion.div>

        {/* Philosophy Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-24 p-8 sm:p-12 rounded-xl"
          style={{ 
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h2 className="text-2xl font-light mb-6" style={{ color: 'var(--accent-gold)' }}>
            Philosophy
          </h2>
          
          <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <p>
              I practice <span style={{ color: 'var(--accent-gold)' }}>Stoicism</span> — not as an academic exercise, 
              but as a living philosophy. The Stoics taught that virtue is the only true good, that we should focus 
              on what's within our control, and that obstacles can become opportunities.
            </p>
            
            <p>
              <span className="italic">"The impediment to action advances action. What stands in the way becomes the way."</span> 
              <br />— Marcus Aurelius
            </p>
            
            <p>
              This site is an experiment in digital Stoicism — a place to practice <span className="font-medium">memento mori</span>, 
              contemplate existential questions, and build tools that help us live more deliberately.
            </p>
          </div>
        </motion.section>

        {/* Principles */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-24"
        >
          <h2 className="text-2xl font-light mb-8" style={{ color: 'var(--text-primary)' }}>
            Guiding Principles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Dichotomy of Control", desc: "Focus energy only on what depends on us" },
              { title: "Memento Mori", desc: "Remember mortality to appreciate life" },
              { title: "Amor Fati", desc: "Love whatever happens as necessary" },
              { title: "Virtue Ethics", desc: "Character is the only true good" },
              { title: "Present Moment", desc: "The past and future don't exist" },
              { title: "Negative Visualization", desc: "Imagine loss to cultivate gratitude" },
            ].map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-6 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <h3 className="text-lg font-light mb-2" style={{ color: 'var(--text-primary)' }}>
                  {principle.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {principle.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <h2 className="text-2xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>
            Get in Touch
          </h2>
          
          <p className="text-base mb-8" style={{ color: 'var(--text-secondary)' }}>
            Open to conversations about philosophy, technology, and the examined life.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { label: "Email", href: "mailto:juan@example.com" },
              { label: "GitHub", href: "https://github.com" },
              { label: "Twitter", href: "https://twitter.com" },
              { label: "LinkedIn", href: "https://linkedin.com" },
            ].map(link => (
              <motion.a
                key={link.label}
                href={link.href}
                className="px-6 py-3 rounded-lg text-sm tracking-wider uppercase transition-all"
                style={{ 
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-primary)',
                }}
                whileHover={{ 
                  scale: 1.05,
                  borderColor: 'var(--accent-gold)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </motion.section>

        {/* Scroll Indicator */}
        <motion.div
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <svg className="w-8 h-8 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="var(--border-secondary)"
              strokeWidth="2"
              fill="none"
            />
            <motion.circle
              cx="16"
              cy="16"
              r="14"
              stroke="var(--accent-gold)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="87.96"
              strokeDashoffset={87.96}
              style={{ strokeDashoffset: useTransform(scrollProgress, [0, 1], [87.96, 0]) }}
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VOICES VIEW - Stoic Oracle Chat (Fixed Layout)
// ═══════════════════════════════════════════════════════════════════

const ORACLE_RESPONSES = [
  "What is within your control in this situation?",
  "Consider: is this preference or need?",
  "The obstacle reveals the path forward.",
  "What would the best version of yourself do?",
  "Remember, you are mortal. Does this still matter?",
  "Focus on your character, not circumstances.",
  "Is this judgment necessary?",
  "What virtue can you practice here?",
  "The past is gone. The future unknowable. What of now?",
  "Does this serve your flourishing?",
  "Nature provides exactly what we need.",
  "Your response is what you control.",
  "See the opportunity in this difficulty.",
  "What is the wise action?",
  "Prefer what happens to what you wish.",
  "This too shall pass. Will you grow from it?",
  "The universe is change. Are you resisting?",
  "What truth are you avoiding?",
  "Virtue needs no audience.",
  "You have time for what matters. Do you use it?",
];

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'oracle';
  timestamp: Date;
}

function VoicesView() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Welcome, seeker. I am the Stoic Oracle. Ask me anything, and I shall respond with the wisdom of the ancients.", 
      sender: 'oracle',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const oracleResponse: Message = {
        id: messages.length + 2,
        text: ORACLE_RESPONSES[Math.floor(Math.random() * ORACLE_RESPONSES.length)],
        sender: 'oracle',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, oracleResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col pt-16">
      {/* Header - Fixed */}
      <div 
        className="flex-shrink-0 px-6 py-6 border-b"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: 'var(--accent-gold-dim)' }}
          >
            🏛️
          </div>
          <div>
            <h1 className="text-xl font-light" style={{ color: 'var(--text-primary)' }}>
              The Stoic Oracle
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Wisdom from the ancients
            </p>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 ${
                  message.sender === 'user' 
                    ? 'rounded-2xl rounded-br-sm' 
                    : 'rounded-2xl rounded-bl-sm'
                }`}
                style={{ 
                  backgroundColor: message.sender === 'user' 
                    ? 'var(--accent-gold)' 
                    : 'var(--bg-elevated)',
                  color: message.sender === 'user' 
                    ? 'var(--bg-primary)' 
                    : 'var(--text-secondary)',
                }}
              >
                <p className="text-sm leading-relaxed">
                  {message.text}
                </p>
                <p 
                  className="text-[10px] mt-1 text-right"
                  style={{ 
                    opacity: 0.6,
                    color: message.sender === 'user' ? 'var(--bg-primary)' : 'var(--text-muted)'
                  }}
                >
                  {message.timestamp.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div 
                className="px-4 py-3 rounded-2xl rounded-bl-sm"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--accent-gold)' }}
                      animate={{ 
                        y: [0, -6, 0],
                        opacity: [0.4, 1, 0.4] 
                      }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: Infinity, 
                        delay: i * 0.15 
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Fixed Bottom */}
      <div 
        className="flex-shrink-0 px-6 py-4 border-t"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-secondary)' 
        }}
      >
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Seek wisdom..."
            className="flex-1 px-4 py-3 rounded-full text-sm transition-all focus:outline-none"
            style={{ 
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            }}
            disabled={isTyping}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ 
              backgroundColor: 'var(--accent-gold)',
              color: 'var(--bg-primary)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COLLECTIVE VIEW - Board of Collective Wisdom
// Now fetches from API and allows users to submit answers
// ═══════════════════════════════════════════════════════════════════

interface Contemplation {
  id: number;
  question: string;
  featured: boolean;
  answers?: StickyNoteData[];
}

interface StickyNoteData {
  id: number;
  question: string;
  answer: string;
  author: string;
  color: string;
  rotation: number;
  positionX: number;
  positionY: number;
  contemplationId?: number | null;
}

// Color mapping for sticky notes
const stickyColors: Record<string, string> = {
  gold: "#fef3c7",
  sage: "#d1fae5",
  stone: "#e7e5e4",
  amber: "#fed7aa",
  bronze: "#fde68a",
};

function CollectiveView() {
  const [contemplations, setContemplations] = useState<Contemplation[]>([]);
  const [answers, setAnswers] = useState<StickyNoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<StickyNoteData | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Contemplation | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { x: mouseX } = useMouseParallax();

  // Fetch contemplations and answers
  useEffect(() => {
    async function fetchData() {
      try {
        const [contRes, ansRes] = await Promise.all([
          fetch("/api/contemplations"),
          fetch("/api/answers"),
        ]);
        
        if (contRes.ok) {
          const data = await contRes.json();
          setContemplations(data);
          // Set featured as default selected question
          const featured = data.find((c: Contemplation) => c.featured);
          if (featured) setSelectedQuestion(featured);
        }
        
        if (ansRes.ok) {
          const data = await ansRes.json();
          setAnswers(data);
        }
      } catch (error) {
        console.error("Failed to fetch collective data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    
    // Auto-refresh: poll every 10 seconds to check for CMS updates
    const refreshInterval = setInterval(fetchData, 10000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Submit answer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !authorName.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: answerText.trim(),
          author: authorName.trim(),
          contemplationId: selectedQuestion?.id,
          question: selectedQuestion?.question,
        }),
      });
      
      if (res.ok) {
        const newAnswer = await res.json();
        setAnswers([newAnswer, ...answers]);
        setAnswerText("");
        setShowAnswerForm(false);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const questions = [...new Set(answers.map(a => a.question))];
  const filteredAnswers = filter 
    ? answers.filter(a => a.question === filter)
    : answers;

  const featuredContemplation = contemplations.find(c => c.featured);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen px-4 sm:px-6 py-24 sm:py-32">
      {/* Contemplation Hero */}
      {featuredContemplation && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto mb-20 text-center"
        >
          <p className="text-xs uppercase tracking-[0.3em] mb-6" style={{ color: 'var(--accent-gold)' }}>
            Today's Contemplation
          </p>
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl font-extralight leading-tight mb-8 italic"
            style={{ 
              color: 'var(--text-primary)',
              fontFamily: "'Georgia', serif",
            }}
          >
            "{featuredContemplation.question}"
          </h2>
          <motion.button
            onClick={() => {
              setSelectedQuestion(featuredContemplation);
              setShowAnswerForm(true);
            }}
            className="px-8 py-3 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: 'var(--accent-gold)',
              color: 'var(--bg-primary)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Share Your Reflection
          </motion.button>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-6xl mx-auto mb-12 text-center"
      >
        <h1 
          className="text-4xl sm:text-5xl font-extralight mb-4 tracking-tight"
          style={{ 
            color: 'var(--text-primary)',
            transform: `translateX(${mouseX * 10}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        >
          Board of Collective
        </h1>
        <p className="text-lg font-light mb-8" style={{ color: 'var(--text-tertiary)' }}>
          Anonymous wisdom from fellow seekers
        </p>

        {/* Question Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <motion.button
            onClick={() => setFilter(null)}
            className="px-4 py-2 rounded-full text-xs transition-all"
            style={{
              backgroundColor: !filter ? 'var(--accent-gold)' : 'var(--bg-elevated)',
              color: !filter ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            All
          </motion.button>
          {questions.slice(0, 6).map((q, i) => (
            <motion.button
              key={i}
              onClick={() => setFilter(q)}
              className="px-4 py-2 rounded-full text-xs transition-all max-w-[200px] truncate"
              style={{
                backgroundColor: filter === q ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                color: filter === q ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {q.slice(0, 30)}...
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* All Contemplation Questions */}
      {contemplations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h3 className="text-xs uppercase tracking-widest mb-6 text-center" style={{ color: 'var(--text-muted)' }}>
            Questions for Reflection
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contemplations.map((c) => (
              <motion.div
                key={c.id}
                className="p-4 rounded-lg cursor-pointer transition-all"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: c.featured ? '1px solid var(--accent-gold)' : '1px solid var(--border-primary)',
                }}
                whileHover={{ scale: 1.02, borderColor: 'var(--accent-gold)' }}
                onClick={() => {
                  setSelectedQuestion(c);
                  setShowAnswerForm(true);
                }}
              >
                <p className="text-sm font-light italic" style={{ color: 'var(--text-secondary)' }}>
                  "{c.question}"
                </p>
                {c.featured && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,162,39,0.2)', color: 'var(--accent-gold)' }}>
                    Featured
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cork Board */}
      <div className="max-w-7xl mx-auto relative">
        {/* Board Background */}
        <div 
          className="absolute inset-0 -m-8 rounded-xl opacity-30"
          style={{
            background: 'repeating-linear-gradient(45deg, var(--bg-tertiary) 0, var(--bg-tertiary) 2px, transparent 2px, transparent 8px)',
          }}
        />

        {/* Sticky Notes Grid */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAnswers.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.8, rotate: note.rotation }}
              animate={{ opacity: 1, scale: 1, rotate: note.rotation }}
              transition={{ 
                delay: index * 0.05,
                type: "spring",
                stiffness: 200,
              }}
              whileHover={{ 
                scale: 1.05, 
                rotate: 0,
                zIndex: 10,
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
              onClick={() => setSelectedNote(note)}
              className="cursor-pointer group"
              style={{ transform: `rotate(${note.rotation}deg)` }}
            >
              {/* Pin */}
              <div 
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10 shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)',
                }}
              />
              
              {/* Note */}
              <div 
                className="p-6 pt-8 min-h-[200px] flex flex-col transition-shadow"
                style={{
                  backgroundColor: stickyColors[note.color] || note.color || stickyColors.gold,
                  boxShadow: '2px 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {/* Question Tag */}
                <p 
                  className="text-[10px] uppercase tracking-wider mb-3 font-medium line-clamp-1"
                  style={{ color: 'rgba(0,0,0,0.4)' }}
                >
                  {note.question.slice(0, 35)}...
                </p>

                {/* Answer */}
                <p 
                  className="flex-1 text-sm leading-relaxed mb-4 italic"
                  style={{ 
                    color: 'rgba(0,0,0,0.75)',
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  "{note.answer}"
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  <span 
                    className="text-xs"
                    style={{ color: 'rgba(0,0,0,0.5)' }}
                  >
                    — {note.author}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAnswers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-light mb-4" style={{ color: 'var(--text-muted)' }}>
              No reflections yet. Be the first to share.
            </p>
            <motion.button
              onClick={() => setShowAnswerForm(true)}
              className="px-6 py-3 rounded-full text-sm"
              style={{
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--bg-primary)',
              }}
              whileHover={{ scale: 1.05 }}
            >
              Share Your Wisdom
            </motion.button>
          </div>
        )}
      </div>

      {/* Expanded Note Modal */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedNote(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Note */}
            <motion.div
              initial={{ scale: 0.8, rotate: selectedNote.rotation }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, rotate: selectedNote.rotation }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full z-10"
            >
              {/* Pin */}
              <div 
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full z-10"
                style={{ 
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)',
                }}
              />
              
              <div 
                className="p-8 pt-10"
                style={{
                  backgroundColor: stickyColors[selectedNote.color] || selectedNote.color || stickyColors.gold,
                  boxShadow: '4px 8px 24px rgba(0,0,0,0.25)',
                }}
              >
                {/* Question */}
                <p 
                  className="text-sm uppercase tracking-wider mb-4 font-medium"
                  style={{ color: 'rgba(0,0,0,0.5)' }}
                >
                  {selectedNote.question}
                </p>

                {/* Answer */}
                <p 
                  className="text-xl leading-relaxed mb-6 italic"
                  style={{ 
                    color: 'rgba(0,0,0,0.85)',
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  "{selectedNote.answer}"
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
                  <span 
                    className="text-sm"
                    style={{ color: 'rgba(0,0,0,0.6)' }}
                  >
                    — {selectedNote.author}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer Form Modal */}
      <AnimatePresence>
        {showAnswerForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={() => setShowAnswerForm(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-xl w-full z-10 rounded-xl p-8"
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
            >
              <button
                onClick={() => setShowAnswerForm(false)}
                className="absolute top-4 right-4 text-xl opacity-50 hover:opacity-100"
                style={{ color: 'var(--text-secondary)' }}
              >
                ×
              </button>

              <h3 className="text-2xl font-light mb-2" style={{ color: 'var(--text-primary)' }}>
                Share Your Reflection
              </h3>
              
              {/* Question selector */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Question
                </label>
                <select
                  value={selectedQuestion?.id || ""}
                  onChange={(e) => {
                    const q = contemplations.find(c => c.id === Number(e.target.value));
                    setSelectedQuestion(q || null);
                  }}
                  className="w-full px-4 py-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Select a question...</option>
                  {contemplations.map(c => (
                    <option key={c.id} value={c.id}>{c.question}</option>
                  ))}
                </select>
              </div>

              {selectedQuestion && (
                <p className="text-lg font-light italic mb-6" style={{ color: 'var(--text-secondary)' }}>
                  "{selectedQuestion.question}"
                </p>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Your Answer
                  </label>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Share your wisdom..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg text-sm resize-none"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Your Name (or Anonymous)
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="A Fellow Seeker"
                    className="w-full px-4 py-3 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={submitting || !answerText.trim() || !authorName.trim()}
                  className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent-gold)',
                    color: 'var(--bg-primary)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {submitting ? "Sharing..." : "Share Reflection"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-4xl mx-auto mt-16 flex items-center justify-center gap-12 text-center"
      >
        <div>
          <p className="text-3xl font-light" style={{ color: 'var(--accent-gold)' }}>
            {answers.length}
          </p>
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Reflections
          </p>
        </div>
        <div className="w-px h-8" style={{ backgroundColor: 'var(--border-primary)' }} />
        <div>
          <p className="text-3xl font-light" style={{ color: 'var(--accent-gold)' }}>
            {contemplations.length}
          </p>
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Questions
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════

// Minimal Sunrise/Sunset Theme Transition
interface ThemeTransitionProps {
  isTransitioning: boolean;
  direction: 'sunrise' | 'sunset';
  onComplete: () => void;
}

function ThemeTransition({ isTransitioning, direction, onComplete }: ThemeTransitionProps) {
  useEffect(() => {
    if (!isTransitioning) return;
    
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [isTransitioning, onComplete]);

  if (!isTransitioning) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
    >
      {/* Sky gradient */}
      <motion.div
        className="absolute inset-0"
        initial={{ 
          background: direction === 'sunrise' 
            ? 'linear-gradient(to top, #0a0a0a 0%, #1a1a2e 100%)'
            : 'linear-gradient(to top, #f5f5f5 0%, #ffffff 100%)'
        }}
        animate={{ 
          background: direction === 'sunrise'
            ? [
                'linear-gradient(to top, #0a0a0a 0%, #1a1a2e 100%)',
                'linear-gradient(to top, #c9a227 0%, #2d1b4e 50%, #1a1a2e 100%)',
                'linear-gradient(to top, #fef3c7 0%, #c9a227 30%, #87ceeb 100%)',
                'linear-gradient(to top, #ffffff 0%, #f5f5f5 100%)',
              ]
            : [
                'linear-gradient(to top, #f5f5f5 0%, #ffffff 100%)',
                'linear-gradient(to top, #c9a227 0%, #ff8c42 30%, #4a3f6b 100%)',
                'linear-gradient(to top, #1a1a2e 0%, #2d1b4e 50%, #c9a227 100%)',
                'linear-gradient(to top, #0a0a0a 0%, #1a1a2e 100%)',
              ]
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* Minimal horizon glow */}
      <motion.div
        className="absolute left-0 right-0 h-32"
        style={{ bottom: '30%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.6, 0] }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <div 
          className="w-full h-full"
          style={{
            background: `radial-gradient(ellipse 80% 100% at 50% 100%, ${
              direction === 'sunrise' ? 'rgba(201,162,39,0.4)' : 'rgba(255,140,66,0.4)'
            } 0%, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* Simple celestial body */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full"
        style={{
          background: direction === 'sunrise'
            ? 'radial-gradient(circle, #ffd700 0%, #c9a227 100%)'
            : 'radial-gradient(circle, #c9a227 0%, #996515 100%)',
          boxShadow: `0 0 40px ${direction === 'sunrise' ? 'rgba(255,215,0,0.5)' : 'rgba(201,162,39,0.4)'}`,
        }}
        initial={{ 
          top: direction === 'sunrise' ? '80%' : '30%',
          opacity: 0,
          scale: 0.5,
        }}
        animate={{ 
          top: direction === 'sunrise' ? '30%' : '80%',
          opacity: [0, 1, 1, 0],
          scale: [0.5, 1, 1, 0.5],
        }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("now");
  const [mounted, setMounted] = useState(false);

  // Restore view from URL or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check URL query param first
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      if (viewParam && ['now', 'writing', 'work', 'about'].includes(viewParam)) {
        setView(viewParam);
        // Clear the URL param
        window.history.replaceState({}, '', '/');
        return;
      }
      // Otherwise check localStorage
      const savedView = localStorage.getItem('currentView');
      if (savedView && ['now', 'writing', 'work', 'about'].includes(savedView)) {
        setView(savedView);
      }
    }
  }, []);

  // Save view to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      localStorage.setItem('currentView', view);
    }
  }, [view, mounted]);
  const { theme, setTheme } = useTheme();
  const { enabled: soundEnabled, toggle: toggleSound, play } = useSound();
  
  // Theme transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'sunrise' | 'sunset'>('sunrise');
  const [pendingTheme, setPendingTheme] = useState<'dark' | 'light' | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme === 'light' ? 'light' : 'dark');
    }
  }, [theme]);

  // Handle theme change with transition
  const handleThemeChange = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    const direction = newTheme === 'light' ? 'sunrise' : 'sunset';
    
    setPendingTheme(newTheme);
    setTransitionDirection(direction);
    setIsTransitioning(true);
    play('ambient');
  }, [theme, play]);

  const handleTransitionComplete = useCallback(() => {
    if (pendingTheme) {
      setTheme(pendingTheme);
      setPendingTheme(null);
    }
    setIsTransitioning(false);
  }, [pendingTheme, setTheme]);

  const pageTransition = {
    initial: { opacity: 0, y: 20, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -20, filter: "blur(10px)" },
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {/* Theme Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <ThemeTransition
            isTransitioning={isTransitioning}
            direction={transitionDirection}
            onComplete={handleTransitionComplete}
          />
        )}
      </AnimatePresence>

      <main 
        className="min-h-screen antialiased selection:bg-blue-500/20 transition-colors duration-500"
        style={{ 
          backgroundColor: 'var(--bg-primary)', 
          color: 'var(--text-primary)' 
        }}
        suppressHydrationWarning
      >
        {/* Scroll indicator */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-px origin-left z-50"
          style={{ 
            backgroundColor: 'var(--accent-gold)',
            opacity: 0.5,
            scaleX: useScrollDepth()
          }}
        />

        {/* Nav */}
        <Nav current={view} onChange={setView} />

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2"
        >
          <button
            onClick={() => { toggleSound(); play('click'); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-primary)'
            }}
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <motion.button
            onClick={handleThemeChange}
            disabled={isTransitioning}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-primary)'
            }}
            title="Toggle theme"
            whileHover={{ scale: 1.1, rotate: theme === 'dark' ? 15 : -15 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.span
              key={theme}
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </motion.span>
          </motion.button>
        </motion.div>

        {/* Views */}
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
            {view === "collective" && <CollectiveView />}
            {view === "about" && <AboutView />}
            {view === "voices" && <VoicesView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
