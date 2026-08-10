'use client';

import { ChatRoom } from '@/components/ChatRoom';
import { PushNotificationSetup } from '@/components/PushNotificationSetup';

export default function ChatPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-3 pt-3 sm:px-4">
        <PushNotificationSetup />
      </div>
      <ChatRoom />
    </div>
  );
}
