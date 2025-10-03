
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import Starfield from '@/components/layout/starfield';

export const metadata: Metadata = {
  title: 'Family Tree Chat',
  description: 'Your family, connected.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body className={cn('min-h-screen bg-transparent font-body antialiased')}>
        <Starfield />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
