import type { Metadata } from 'next';
import NJHeader from '@/components/layout/NJHeader';
import NJFooter from '@/components/layout/NJFooter';

export const metadata: Metadata = {
  title: 'NJIRLAH AI — Platform AI Multi-Model Terkeren',
  description: 'Akses ratusan model AI dari semua provider terkemuka lewat satu platform. Bebas pilih, bebas kreasi, BYOK.',
};

export default function NJLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <NJHeader />
      <main>{children}</main>
      <NJFooter />
    </div>
  );
}
