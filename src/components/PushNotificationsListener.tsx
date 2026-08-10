'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useFirebaseApp, useFirestore } from '@/firebase';
import {
  isPushNotificationsEnabled,
  listenForForegroundMessages,
  registerPushNotifications,
} from '@/lib/messaging';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/LocaleProvider';

export function PushNotificationsListener() {
  const { user, isApproved } = useAuth();
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isPushNotificationsEnabled()) return;
    if (!user || !isApproved || typeof window === 'undefined') return;

    if ('Notification' in window && Notification.permission === 'granted') {
      void registerPushNotifications(firebaseApp, firestore, user.uid).catch((error) => {
        console.error('Push token registration failed:', error);
      });
    }

    return listenForForegroundMessages(
      firebaseApp,
      (payload) => {
        const title =
          payload.data?.title ?? payload.notification?.title ?? t('chat.newMessage');
        const body = payload.data?.body ?? payload.notification?.body;
        const url = payload.data?.url ?? '/chat';

        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          void navigator.serviceWorker
            .getRegistration('/')
            .then((registration) =>
              registration?.showNotification(title, {
              body,
              icon: payload.data?.icon ?? '/icons/icon-192.png',
              badge: '/icons/icon-48.png',
              tag: payload.data?.tag ?? 'ndcpc-notification',
              data: { url },
              })
            );
        }

        toast({
          title,
          description: body,
        });
      },
      true
    );
  }, [user, isApproved, firebaseApp, firestore, t, toast]);

  useEffect(() => {
    if (!user || !isApproved || !isPushNotificationsEnabled()) return;

    const refreshToken = () => {
      if (
        document.visibilityState === 'visible' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        void registerPushNotifications(firebaseApp, firestore, user.uid).catch((error) => {
          console.error('Push token refresh failed:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', refreshToken);
    return () => document.removeEventListener('visibilitychange', refreshToken);
  }, [firebaseApp, firestore, isApproved, user]);

  return null;
}
