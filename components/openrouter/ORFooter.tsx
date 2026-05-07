import Link from 'next/link';

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Models', href: '/openrouter/models' },
      { label: 'Rankings', href: '/openrouter/rankings' },
      { label: 'Chat', href: '/openrouter/chat' },
      { label: 'Pricing', href: '#' },
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

export default function ORFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand col */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="14" fill="#6467F2" />
                <path d="M8 10h5l3 4-3 4H8l3-4-3-4z" fill="white" opacity="0.9" />
                <path d="M13 10h7l-3 4 3 4h-7l3-4-3-4z" fill="white" />
              </svg>
              <span className="font-semibold text-gray-900 text-sm">OpenRouter</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[180px]">
              A unified interface for large language models.
            </p>
            <p className="text-xs text-gray-400 mt-4">© {new Date().getFullYear()} OpenRouter Inc.</p>
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
