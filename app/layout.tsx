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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#05050A] text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
