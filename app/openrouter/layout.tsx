import type { Metadata } from 'next';
import ORHeader from '@/components/openrouter/ORHeader';
import ORFooter from '@/components/openrouter/ORFooter';

export const metadata: Metadata = {
  title: 'OpenRouter — The Unified AI Gateway',
  description: 'Access hundreds of AI models through a single API. Compare prices, performance, and capabilities across all major providers.',
};

export default function OpenRouterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <ORHeader />
      <main>{children}</main>
      <ORFooter />
    </div>
  );
}
