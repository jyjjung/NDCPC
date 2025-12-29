import type { Metadata } from 'next';
import './globals.css';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'NDC Preschool Church',
  description: 'Resources and schedules for NDC Preschool Church volunteers and caregivers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        {children}
      </body>
    </html>
  );
}
