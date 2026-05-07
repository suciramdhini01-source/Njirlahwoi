'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, Zap } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Models', href: '/models' },
  { label: 'Rankings', href: '/rankings' },
  { label: 'Chat', href: '/chat' },
  { label: 'NJIRLAH AI', href: '/chat-njirlah' },
  { label: 'Agent', href: '/agent' },
];

export default function NJHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') searchRef.current?.blur();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm'
          : 'bg-white border-b border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6467F2] to-[#818DF8] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">
            NJIRLAH <span className="text-[#6467F2]">AI</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <div
            className={`flex items-center gap-2 h-8 px-3 rounded-lg border cursor-text transition-all duration-150 ${
              searchFocused
                ? 'border-[#6467F2] ring-2 ring-[#6467F2]/20 bg-white'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search models..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {!searchFocused && (
              <kbd className="hidden lg:flex items-center px-1.5 py-0.5 text-[10px] text-gray-400 bg-white border border-gray-200 rounded font-mono">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-0.5 ml-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors duration-150 ${
                isActive(link.href)
                  ? 'text-[#6467F2] bg-[#6467F2]/8 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
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
            Sign up free
          </Link>
        </div>

        {/* Mobile toggle */}
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
            <div className="flex items-center gap-2 h-9 px-3 mb-2 rounded-lg border border-gray-200 bg-gray-50">
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
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive(link.href)
                    ? 'text-[#6467F2] bg-[#6467F2]/8 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
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
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
