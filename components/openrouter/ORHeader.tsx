'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Models', href: '/openrouter/models' },
  { label: 'Rankings', href: '/openrouter/rankings' },
  { label: 'Chat', href: '/openrouter/chat' },
  { label: 'Docs', href: '#' },
  { label: 'Pricing', href: '#' },
];

export default function ORHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-200 ${
        scrolled ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm' : 'bg-white border-b border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
        {/* Logo */}
        <Link href="/openrouter" className="flex items-center gap-2 shrink-0 group">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="group-hover:opacity-80 transition-opacity">
            <circle cx="14" cy="14" r="14" fill="#6467F2" />
            <path d="M8 10h5l3 4-3 4H8l3-4-3-4z" fill="white" opacity="0.9" />
            <path d="M13 10h7l-3 4 3 4h-7l3-4-3-4z" fill="white" />
          </svg>
          <span className="font-semibold text-gray-900 text-sm tracking-tight">OpenRouter</span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <div
            className={`flex items-center gap-2 h-8 px-3 rounded-md border cursor-text transition-all duration-150 ${
              searchOpen
                ? 'border-[#6467F2] ring-2 ring-[#6467F2]/20 bg-white'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          >
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search models..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
              onBlur={() => setSearchOpen(false)}
            />
            {!searchOpen && (
              <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-gray-400 bg-white border border-gray-200 rounded font-mono">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-0.5 ml-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-2 ml-2 shrink-0">
          <Link
            href="#"
            className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-150"
          >
            Sign in
          </Link>
          <Link
            href="#"
            className="px-3 py-1.5 text-sm font-medium text-white bg-[#6467F2] hover:bg-[#5558e8] rounded-full transition-colors duration-150"
          >
            Sign up
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto p-2 rounded-md hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {/* Mobile search */}
            <div className="flex items-center gap-2 h-9 px-3 mb-2 rounded-md border border-gray-200 bg-gray-50">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search models..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <Link href="#" className="flex-1 text-center py-2 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50">
                Sign in
              </Link>
              <Link href="#" className="flex-1 text-center py-2 text-sm font-medium text-white bg-[#6467F2] rounded-full hover:bg-[#5558e8]">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
