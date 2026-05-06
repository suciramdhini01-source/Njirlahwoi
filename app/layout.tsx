import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NJIRLAH AI — Chat AI Tersesat, Bebas Pake Kunci Sendiri',
  description: 'Platform chat AI multi-model. Mode tamu gratis, BYOK untuk semua provider.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className="bg-[#05050A] text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
