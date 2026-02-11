// src/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type NavKey = 'home' | 'about' | 'layout' | 'stats' | 'profile' | 'admin';

export interface LayoutProps {
  user: { id: string; name: string; isMember: boolean; isAdmin?: boolean } | null;
  currentPage: NavKey;
  onNavigate: (key: NavKey) => void;
  onLogin: () => void;
  onLogout: () => void;
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  currentPage,
  onNavigate,
  onLogin,
  onLogout,
  children,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the menu on route change / resize to desktop
  useEffect(() => setMenuOpen(false), [currentPage]);
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false); // lg breakpoint
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const NavLink = ({
    to,
    children,
    hiddenOnMobile = false,
  }: { to: NavKey; children: ReactNode; hiddenOnMobile?: boolean }) => {
    const isActive = currentPage === to;
    const base =
      'block px-3 py-2 rounded-lg transition-colors hover:text-white hover:bg-neutral-700/50';
    const active = isActive ? 'text-amber-300 bg-neutral-700/50' : 'text-neutral-300';
    const mobile = hiddenOnMobile ? 'hidden lg:block' : '';
    return (
      <button
        onClick={() => onNavigate(to)}
        className={`${base} ${active} ${mobile}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <header className="sticky top-0 z-[100] bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}images/logo.svg`} alt="Axes & Ales" className="h-8 w-8" />
            <span className="font-extrabold tracking-wide">Axes & Ales</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="home">Book a Table</NavLink>
            <NavLink to="about">About</NavLink>
            <NavLink to="layout">Club Layout</NavLink>
            {user?.isAdmin && <NavLink to="stats">Stats</NavLink>}
            {user && <NavLink to="profile">Profile</NavLink>}
            {user?.isAdmin && <NavLink to="admin">Admin</NavLink>}
          </nav>

          {/* Auth / CTA (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {!user ? (
              <button
                onClick={onLogin}
                className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-semibold"
              >
                Sign in
              </button>
            ) : (
              <button
                onClick={onLogout}
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
              >
                Sign out
              </button>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(v => !v)}
          >
            {/* Visible bars (ensure color contrast) */}
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {menuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile drawer */}
        <div
          id="mobile-menu"
          className={`lg:hidden border-t border-neutral-800 bg-neutral-950 ${
            menuOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="px-4 py-3 space-y-1">
            <NavLink to="home">Book a Table</NavLink>
            <NavLink to="about">About</NavLink>
            <NavLink to="layout">Club Layout</NavLink>
            {user?.isAdmin && <NavLink to="stats">Stats</NavLink>}
            {user && <NavLink to="profile">Profile</NavLink>}
            {user?.isAdmin && <NavLink to="admin">Admin</NavLink>}

            <div className="pt-2 border-t border-neutral-800 mt-2">
              {!user ? (
                <button
                  onClick={onLogin}
                  className="w-full px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-semibold"
                >
                  Sign in
                </button>
              ) : (
                <button
                  onClick={onLogout}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
};
