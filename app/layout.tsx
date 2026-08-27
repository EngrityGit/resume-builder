import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Engrity Resume Flow',
  description: 'Internal AI-powered resume creation, formatting, and management for Engrity Group Inc.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}  suppressHydrationWarning>
      <body className="font-sans antialiased bg-white text-[#070B20]">{children}</body>
    </html>
  );
}
