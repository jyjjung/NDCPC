'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useFirebaseApp, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/LocaleProvider';
import {
  registerPushNotifications,
  isPushNotificationsEnabled,
  requestPushVerification,
} from '@/lib/messaging';
import { useToast } from '@/hooks/use-toast';

const PROMPT_KEY = 'ndcpc_push_prompted';

export function PushNotificationSetup() {
  const { user, isApproved } = useAuth();
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'enabled' | 'disabled' | 'unsupported'>(
    'loading'
  );
  const [isEnabling, setIsEnabling] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isPushNotificationsEnabled()) return;
    if (!user || !isApproved || typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setStatus('unsupported');
      return;
    }

    const permission = Notification.permission;
    setStatus(permission === 'granted' ? 'enabled' : 'disabled');
    setShowBanner(!localStorage.getItem(PROMPT_KEY) || permission !== 'granted');
  }, [user, isApproved]);

  const enableNotifications = async () => {
    if (!user) return;

    setIsEnabling(true);
    try {
      const result = await registerPushNotifications(firebaseApp, firestore, user.uid);
      localStorage.setItem(PROMPT_KEY, 'true');

      if (result === 'granted') {
        setStatus('enabled');
        setShowBanner(false);
        await requestPushVerification(firestore, user.uid);
        toast({ title: t('chat.notificationsEnabled') });
        return;
      }

      if (result === 'missing_vapid') {
        toast({
          variant: 'destructive',
          title: t('chat.notificationsMissingVapid'),
        });
        return;
      }

      if (result === 'invalid_vapid') {
        toast({
          variant: 'destructive',
          title: t('chat.notificationsInvalidVapid'),
        });
        return;
      }

      if (result === 'unsupported') {
        setStatus('unsupported');
        return;
      }

      setStatus('disabled');
      toast({ variant: 'destructive', title: t('chat.notificationsBlocked') });
    } finally {
      setIsEnabling(false);
    }
  };

  if (!isPushNotificationsEnabled()) return null;
  if (!user || !isApproved || status === 'loading' || status === 'enabled' || status === 'unsupported') {
    return null;
  }

  if (!showBanner) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('chat.notificationsTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('chat.notificationsHint')}</p>
        </div>
      </div>
      <Button size="sm" disabled={isEnabling} onClick={() => void enableNotifications()}>
        {isEnabling ? t('chat.enablingNotifications') : t('chat.enableNotifications')}
      </Button>
    </div>
  );
}

export function PushNotificationStatus() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (!isPushNotificationsEnabled()) return;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (!isPushNotificationsEnabled()) return null;
  if (!permission || permission === 'default') {
    return null;
  }

  return (
    <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
      {permission === 'granted' ? (
        <>
          <Bell className="h-3.5 w-3.5" />
          {t('chat.notificationsOn')}
        </>
      ) : (
        <>
          <BellOff className="h-3.5 w-3.5" />
          {t('chat.notificationsOff')}
        </>
      )}
    </p>
  );
}
