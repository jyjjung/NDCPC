'use client';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="chat-fullscreen flex min-h-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
