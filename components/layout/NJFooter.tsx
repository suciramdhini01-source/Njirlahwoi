import Link from 'next/link';
import { Zap, Heart } from 'lucide-react';

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Models', href: '/models' },
      { label: 'Rankings', href: '/rankings' },
      { label: 'Chat', href: '/chat' },
      { label: 'Agent Builder', href: '/agent' },
      { label: 'API Reference', href: '#' },
    ],
  },
  {
    heading: 'Providers',
    links: [
      { label: 'OpenAI', href: '#' },
      { label: 'Anthropic', href: '#' },
      { label: 'Google', href: '#' },
      { label: 'Meta', href: '#' },
      { label: 'Mistral', href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Quickstart', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Privacy', href: '#' },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'Discord', href: '#' },
      { label: 'Twitter / X', href: '#' },
      { label: 'GitHub', href: '#' },
      { label: 'Newsletter', href: '#' },
      { label: 'Forum', href: '#' },
    ],
  },
];

export default function NJFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/home" className="flex items-center gap-2 mb-3 group w-fit">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6467F2] to-[#818DF8] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-gray-900 text-sm">
                NJIRLAH <span className="text-[#6467F2]">AI</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[180px]">
              Platform AI multi-model. Bebas pakai, bebas pilih, bebas kreasi.
            </p>
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              Dibuat dengan <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> oleh Andikaa Saputraa
            </p>
            <p className="text-xs text-gray-400 mt-1">© {new Date().getFullYear()} NJIRLAH AI</p>
          </div>

          {/* Nav cols */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
