// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATION - Simple password-based auth for personal blog
// "Know thyself" - Oracle at Delphi
// ═══════════════════════════════════════════════════════════════════

const ADMIN_PASSWORD = "stoic2025"; // Change this to your password
const AUTH_KEY = "stoic_admin_auth";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthSession {
  authenticated: boolean;
  expiresAt: number;
}

export function login(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    const session: AuthSession = {
      authenticated: true,
      expiresAt: Date.now() + SESSION_DURATION,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    }
    return true;
  }
  return false;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return false;
  
  try {
    const session: AuthSession = JSON.parse(stored);
    if (session.authenticated && session.expiresAt > Date.now()) {
      return true;
    }
    // Session expired
    localStorage.removeItem(AUTH_KEY);
    return false;
  } catch {
    return false;
  }
}

export function useAuth(): { isAuth: boolean; loading: boolean } {
  // This is a simple sync check - in real app you'd use a proper hook
  if (typeof window === "undefined") {
    return { isAuth: false, loading: true };
  }
  return { isAuth: isAuthenticated(), loading: false };
}
