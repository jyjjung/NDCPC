import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AdminProvider } from '@/context/AdminProvider';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'NDC Preschooler\'s Church',
  description: 'Resources and schedules for NDC Preschooler\'s Church volunteers and caregivers.',
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
        <AdminProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </AdminProvider>
      </body>
    </html>
  );
}
