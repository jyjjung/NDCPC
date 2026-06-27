'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useFirebaseApp, useFirestore } from '@/firebase';
import { listenForForegroundMessages, registerPushNotifications, isChatNotificationsEnabled, isPushNotificationsEnabled } from '@/lib/messaging';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/LocaleProvider';

export function PushNotificationsListener() {
  const { user, isApproved, profile } = useAuth();
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isPushNotificationsEnabled()) return;
    if (!user || !isApproved || typeof window === 'undefined') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    void registerPushNotifications(firebaseApp, firestore, user.uid);

    return listenForForegroundMessages(
      firebaseApp,
      (payload) => {
        toast({
          title: payload.notification?.title ?? t('chat.newMessage'),
          description: payload.notification?.body,
        });
      },
      isChatNotificationsEnabled(profile)
    );
  }, [user, isApproved, profile, firebaseApp, firestore, t, toast]);

  return null;
}
