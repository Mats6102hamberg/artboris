'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect, useCallback } from 'react';

const navItems = [
  {
    label: 'Studio',
    href: '/wallcraft/studio',
    match: '/wallcraft/studio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 12c0-3.77 0-5.66.88-6.95a5 5 0 0 1 1.17-1.17C5.34 3 7.23 3 11 3h2c3.77 0 5.66 0 6.95.88a5 5 0 0 1 1.17 1.17C22 6.34 22 8.23 22 12c0 3.77 0 5.66-.88 6.95a5 5 0 0 1-1.17 1.17C18.66 21 16.77 21 13 21h-2c-3.77 0-5.66 0-6.95-.88a5 5 0 0 1-1.17-1.17C2 17.66 2 15.77 2 12Z" />
        <path d="m7 17 3.47-4.63a2 2 0 0 1 3.06-.12L17 17" />
        <circle cx="16" cy="8" r="2" />
      </svg>
    ),
  },
  {
    label: 'Galleri',
    href: '/wallcraft/gallery',
    match: '/wallcraft/gallery',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Market',
    href: '/market',
    match: '/market',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 7V4h16v3" />
        <path d="M9 20h6" />
        <path d="M12 4v16" />
        <path d="m15 7-3-3-3 3" />
        <path d="M4 7c0 3 2 5 4 5s4-2 4-5" />
        <path d="M12 7c0 3 2 5 4 5s4-2 4-5" />
      </svg>
    ),
  },
  {
    label: 'Scanner',
    href: '/scanner',
    match: '/scanner',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    label: 'Poster Lab',
    href: '/poster-lab',
    match: '/poster-lab',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h3" />
      </svg>
    ),
  },
];

const hiddenPrefixes = ['/admin', '/auth', '/checkout', '/result', '/boris'];

export default function GlobalNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    if (currentY > lastScrollY.current + scrollThreshold) {
      setHidden(true);
      setMenuOpen(false);
    } else if (currentY < lastScrollY.current - scrollThreshold) {
      setHidden(false);
    }
    lastScrollY.current = currentY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  if (hiddenPrefixes.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const isLoggedIn = status === 'authenticated' && !!session?.user;

  return (
    <nav
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900/85 backdrop-blur-sm text-white rounded-full px-1.5 py-1 shadow-lg transition-all duration-300 ${hidden ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      aria-label="Global navigation"
    >
      <ul className="flex items-center gap-0.5">
        {navItems.map((item, i) => {
          const isActive = pathname.startsWith(item.match);
          return (
            <li key={item.href} className="flex items-center">
              {i > 0 && (
                <span className="w-px h-5 bg-white/20 mx-0.5" aria-hidden="true" />
              )}
              <Link
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.icon}
              </Link>
            </li>
          );
        })}

        {/* Divider + Account/Login button */}
        <li className="flex items-center">
          <span className="w-px h-5 bg-white/20 mx-0.5" aria-hidden="true" />
          {isLoggedIn ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center justify-center w-9 h-9 rounded-full transition-colors text-white/60 hover:text-white hover:bg-white/10"
                aria-label="Konto"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-5 h-5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5.34 19.65A7.97 7.97 0 0 1 12 16a7.97 7.97 0 0 1 6.66 3.65A9.94 9.94 0 0 1 12 22a9.94 9.94 0 0 1-6.66-2.35Z" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/20 rounded-lg shadow-xl py-1 min-w-[120px]">
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Logga ut
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              title="Logga in"
              className="flex items-center justify-center w-9 h-9 rounded-full transition-colors text-white/60 hover:text-white hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M5.34 19.65A7.97 7.97 0 0 1 12 16a7.97 7.97 0 0 1 6.66 3.65" />
              </svg>
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
