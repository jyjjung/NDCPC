'use client';

import { AuthGate } from '@/components/AuthGate';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="flex h-dvh flex-col overflow-hidden sm:pl-56">
          <Header />
          <main className="mx-auto flex w-full max-w-4xl min-h-0 flex-1 flex-col px-5 py-8 sm:px-10 sm:py-10 has-[.chat-fullscreen]:max-w-none has-[.chat-fullscreen]:px-0 has-[.chat-fullscreen]:py-0">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </AuthGate>
  );
}
