import type { Metadata } from 'next';
import NJHeader from '@/components/layout/NJHeader';
import NJFooter from '@/components/layout/NJFooter';

export const metadata: Metadata = {
  title: 'NJIRLAH AI — Platform AI Multi-Model',
  description: 'Akses ratusan model AI dari semua provider terkemuka lewat satu platform. BYOK, bebas pilih, bebas kreasi.',
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <NJHeader />
      <main>{children}</main>
      <NJFooter />
    </div>
  );
}
