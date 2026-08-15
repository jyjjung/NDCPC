'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { useAuth } from '@/context/AuthProvider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Announcement, ChatMessage } from '@/lib/types';
import {
  getLastReadAt,
  READ_TRACKING_KEYS,
  setLastReadAt,
} from '@/lib/read-tracking';
import {
  countUnreadAnnouncements,
  countUnreadChatMessages,
  getLatestAnnouncementReadAt,
} from '@/lib/unread-counts';

type UnreadCountsContextValue = {
  chatUnread: number;
  announcementsUnread: number;
};

const UnreadCountsContext = createContext<UnreadCountsContextValue>({
  chatUnread: 0,
  announcementsUnread: 0,
});

export function UnreadCountsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const pathname = usePathname();
  const uid = user?.uid;

  const [announcementsLastRead, setAnnouncementsLastRead] = useState(0);

  useEffect(() => {
    if (!uid) return;
    setAnnouncementsLastRead(getLastReadAt(READ_TRACKING_KEYS.announcements, uid));
  }, [uid]);

  const chatQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'ndcpcChatMessages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [firestore]);

  const announcementsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ndcpcAnnouncements'), orderBy('date', 'desc'), limit(50));
  }, [firestore]);

  const { data: chatMessages } = useCollection<ChatMessage>(chatQuery);
  const { data: announcements } = useCollection<Announcement>(announcementsQuery);

  useEffect(() => {
    if (!uid || announcementsLastRead !== 0 || !announcements?.length) return;

    const readAt = getLatestAnnouncementReadAt(announcements);
    setLastReadAt(READ_TRACKING_KEYS.announcements, uid, readAt);
    setAnnouncementsLastRead(readAt);
  }, [uid, announcements, announcementsLastRead]);

  useEffect(() => {
    if (!uid || !pathname.startsWith('/announcements')) return;

    const readAt = getLatestAnnouncementReadAt(announcements);
    setLastReadAt(READ_TRACKING_KEYS.announcements, uid, readAt);
    setAnnouncementsLastRead(readAt);
  }, [uid, pathname, announcements]);

  useEffect(() => {
    if (!uid || !pathname.startsWith('/chat')) return;
    setLastReadAt(READ_TRACKING_KEYS.chat, uid, Date.now());
  }, [uid, pathname]);

  const chatUnread = useMemo(() => {
    if (!uid || pathname.startsWith('/chat')) return 0;
    return countUnreadChatMessages(chatMessages, uid);
  }, [chatMessages, pathname, uid]);

  const announcementsUnread = useMemo(() => {
    if (!uid || pathname.startsWith('/announcements')) return 0;
    return countUnreadAnnouncements(announcements, announcementsLastRead);
  }, [announcements, announcementsLastRead, pathname, uid]);

  const value = useMemo(
    () => ({ chatUnread, announcementsUnread }),
    [chatUnread, announcementsUnread]
  );

  useEffect(() => {
    const totalUnread = chatUnread + announcementsUnread;
    const badgeNavigator = navigator as Navigator & {
      setAppBadge?: (count: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };

    if (totalUnread > 0) {
      void badgeNavigator.setAppBadge?.(totalUnread).catch(() => {});
    } else {
      void badgeNavigator.clearAppBadge?.().catch(() => {});
    }
  }, [announcementsUnread, chatUnread]);

  return (
    <UnreadCountsContext.Provider value={value}>{children}</UnreadCountsContext.Provider>
  );
}

export function useUnreadCounts() {
  return useContext(UnreadCountsContext);
}
