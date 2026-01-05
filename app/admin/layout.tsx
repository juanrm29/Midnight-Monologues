"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, logout } from "@/lib/auth";

// ═══════════════════════════════════════════════════════════════════
// ADMIN LAYOUT - Protected layout with sidebar navigation
// "Order your soul. Reduce your wants." - Epictetus
// ═══════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "◉", href: "/admin" },
  { id: "articles", label: "Articles", icon: "✎", href: "/admin/articles" },
  { id: "projects", label: "Projects", icon: "⬡", href: "/admin/projects" },
  { id: "profile", label: "Profile", icon: "◯", href: "/admin/profile" },
  { id: "quotes", label: "Quotes", icon: "❝", href: "/admin/quotes" },
  { id: "collective", label: "Collective", icon: "▣", href: "/admin/collective" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Skip auth check for login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      setIsAuthed(true); // Allow login page to render
      return;
    }

    // Force light theme for CMS
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    const authed = isAuthenticated();
    if (!authed) {
      router.push("/admin/login");
    } else {
      setIsAuthed(true);
    }
    setLoading(false);
    
    // Restore theme when leaving admin
    return () => {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(savedTheme === 'light' ? 'light' : 'dark');
    };
  }, [pathname, router, isLoginPage]);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  // Show nothing while checking auth
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
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

  // Login page gets its own layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Write/Edit pages get their own minimal layout (no sidebar)
  const isWritePage = pathname.includes("/articles/write") || pathname.includes("/articles/edit");
  if (isWritePage) {
    return <>{children}</>;
  }

  // Not authenticated
  if (!isAuthed) {
    return null;
  }

  // Determine active nav item
  const activeNav = NAV_ITEMS.find(item => 
    item.href === pathname || 
    (pathname.startsWith(item.href) && item.href !== "/admin")
  ) || NAV_ITEMS[0];

  return (
    <div 
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 bottom-0 w-64 z-40 flex flex-col"
            style={{ 
              backgroundColor: "var(--bg-elevated)",
              borderRight: "1px solid var(--border-primary)"
            }}
          >
            {/* Logo */}
            <div 
              className="p-6 flex items-center gap-3"
              style={{ borderBottom: "1px solid var(--border-secondary)" }}
            >
              <span className="text-xl">🏛️</span>
              <div>
                <h1 
                  className="text-lg font-light tracking-wide"
                  style={{ color: "var(--text-primary)" }}
                >
                  Sanctum
                </h1>
                <p 
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Content Manager
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = item.id === activeNav.id;
                return (
                  <Link key={item.id} href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 cursor-pointer`}
                      style={{ 
                        backgroundColor: isActive ? "var(--bg-primary)" : "transparent",
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        border: isActive ? "1px solid var(--border-primary)" : "1px solid transparent"
                      }}
                    >
                      <span 
                        className="text-base"
                        style={{ color: isActive ? "var(--accent-gold)" : "var(--text-muted)" }}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div 
              className="p-4 space-y-2"
              style={{ borderTop: "1px solid var(--border-secondary)" }}
            >
              <Link href="/" target="_blank">
                <div 
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>↗</span>
                  View Site
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                <span>⎋</span>
                Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}
      >
        {/* Top Bar */}
        <header 
          className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between backdrop-blur-sm"
          style={{ 
            backgroundColor: "rgba(var(--bg-primary-rgb), 0.8)",
            borderBottom: "1px solid var(--border-secondary)"
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-all duration-200 hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <div>
              <h2 
                className="text-lg font-light"
                style={{ color: "var(--text-primary)" }}
              >
                {activeNav.label}
              </h2>
              <p 
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Manage your {activeNav.label.toLowerCase()}
              </p>
            </div>
          </div>

          <div 
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {new Date().toLocaleDateString("en-US", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
