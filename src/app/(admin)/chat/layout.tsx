'use client';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="chat-fullscreen flex h-full min-h-0 flex-1 flex-col">{children}</div>;
}
