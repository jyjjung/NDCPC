import type { Announcement, ChatMessage } from '@/lib/types';
import { isChatMessageDeleted } from '@/lib/chat-message-meta';

export function getFirestoreMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;

  const record = value as { seconds?: number; toDate?: () => Date };
  if (typeof record.toDate === 'function') {
    return record.toDate().getTime();
  }
  if (typeof record.seconds === 'number') {
    return record.seconds * 1000;
  }

  return 0;
}

export function countUnreadAnnouncements(
  announcements: Announcement[] | null | undefined,
  lastReadAt: number
) {
  if (!announcements?.length) return 0;

  return announcements.filter((announcement) => {
    return getFirestoreMillis(announcement.date) > lastReadAt;
  }).length;
}

export function countUnreadChatMessages(
  messages: ChatMessage[] | null | undefined,
  userId: string | undefined
) {
  if (!messages?.length || !userId) return 0;

  return messages.filter((message) => {
    if (isChatMessageDeleted(message)) return false;
    return message.authorUid !== userId && !message.seenBy?.[userId];
  }).length;
}

export function getLatestAnnouncementReadAt(
  announcements: Announcement[] | null | undefined
) {
  if (!announcements?.length) return Date.now();

  const latest = announcements.reduce(
    (max, announcement) => Math.max(max, getFirestoreMillis(announcement.date)),
    0
  );

  return latest || Date.now();
}
