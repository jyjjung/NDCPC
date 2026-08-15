'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, Camera, Wrench } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useFirebaseApp, useFirestore, useStorage } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/UserAvatar';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/LocaleProvider';
import {
  fixPushNotifications,
  isChatNotificationsEnabled,
  isPushNotificationsEnabled,
  requestPushVerification,
  updateChatNotificationPref,
} from '@/lib/messaging';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export function SettingsView() {
  const { user, profile } = useAuth();
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isFixingPush, setIsFixingPush] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(isChatNotificationsEnabled(profile));
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }
  }, []);

  useEffect(() => {
    setChatEnabled(isChatNotificationsEnabled(profile));
  }, [profile]);

  if (!user || !profile) {
    return null;
  }

  const handlePhotoChange = async (file: File) => {
    if (!firestore || !storage) return;

    setIsUploadingPhoto(true);
    try {
      const storagePath = `${user.uid}_ndcpc_${Date.now()}.jpg`;
      const storageRef = ref(storage, `avatars/${storagePath}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      const userRef = doc(firestore, 'users', user.uid);
      const snap = await getDoc(userRef);
      const existingAvatars = (snap.data()?.avatars as Record<string, unknown> | undefined) ?? {};
      await updateDoc(userRef, {
        avatars: {
          ...existingAvatars,
          ndcpc: { mode: 'image', imageUrl: downloadUrl, cosmeticTier: 'none' },
        },
      });
      await updateProfile(user, { photoURL: downloadUrl });

      toast({ title: t('settings.photoUpdated') });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChatToggle = async (enabled: boolean) => {
    if (!firestore) return;

    setChatEnabled(enabled);
    try {
      await updateChatNotificationPref(firestore, user.uid, enabled);
      toast({ title: enabled ? t('settings.chatNotificationsOn') : t('settings.chatNotificationsOff') });
    } catch (error) {
      console.error(error);
      setChatEnabled(!enabled);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    }
  };

  const handleFixPush = async () => {
    setIsFixingPush(true);
    try {
      const result = await fixPushNotifications(firebaseApp, firestore, user.uid);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }

      if (result === 'granted') {
        await requestPushVerification(firestore, user.uid);
        toast({ title: t('settings.pushFixed') });
        return;
      }

      if (result === 'missing_vapid') {
        toast({ variant: 'destructive', title: t('chat.notificationsMissingVapid') });
        return;
      }

      if (result === 'invalid_vapid') {
        toast({ variant: 'destructive', title: t('chat.notificationsInvalidVapid') });
        return;
      }

      if (result === 'unsupported') {
        toast({ variant: 'destructive', title: t('settings.pushUnsupported') });
        return;
      }

      toast({ variant: 'destructive', title: t('chat.notificationsBlocked') });
    } finally {
      setIsFixingPush(false);
    }
  };

  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
      const registration = await fixPushNotifications(
        firebaseApp,
        firestore,
        user.uid
      );
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
      if (registration !== 'granted') {
        if (registration === 'missing_vapid') {
          toast({ variant: 'destructive', title: t('chat.notificationsMissingVapid') });
        } else if (registration === 'invalid_vapid') {
          toast({ variant: 'destructive', title: t('chat.notificationsInvalidVapid') });
        } else if (registration === 'unsupported') {
          toast({ variant: 'destructive', title: t('settings.pushUnsupported') });
        } else {
          toast({ variant: 'destructive', title: t('chat.notificationsBlocked') });
        }
        return;
      }

      await requestPushVerification(firestore, user.uid);
      toast({ title: t('settings.testSent') });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('settings.testFailed'),
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-border/40 p-5">
        <div>
          <h2 className="font-headline text-lg font-semibold">{t('settings.profileTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.profileHint')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar size="lg" />
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handlePhotoChange(file);
              }}
            />
            <Button
              variant="outline"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              {isUploadingPhoto ? t('settings.uploadingPhoto') : t('settings.changePhoto')}
            </Button>
            <p className="text-xs text-muted-foreground">{profile.displayName}</p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>
      </section>

      {isPushNotificationsEnabled() ? (
      <section className="space-y-4 rounded-xl border border-border/40 p-5">
        <div>
          <h2 className="font-headline text-lg font-semibold">{t('settings.notificationsTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.notificationsHint')}</p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/30 px-4 py-3">
          <div className="space-y-1">
            <Label htmlFor="chat-notifications" className="text-sm font-medium">
              {t('settings.chatNotifications')}
            </Label>
            <p className="text-xs text-muted-foreground">{t('settings.chatNotificationsHint')}</p>
          </div>
          <Switch
            id="chat-notifications"
            checked={chatEnabled}
            onCheckedChange={(checked) => void handleChatToggle(checked)}
          />
        </div>

        <div className="rounded-lg border border-border/30 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t('settings.pushStatus')}</p>
          <p className="mt-1">
            {permission === 'granted'
              ? t('settings.permissionGranted')
              : permission === 'denied'
                ? t('settings.permissionDenied')
                : permission === 'unsupported'
                  ? t('settings.pushUnsupported')
                  : t('settings.permissionDefault')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={isFixingPush} onClick={() => void handleFixPush()}>
            <Wrench className="mr-2 h-4 w-4" />
            {isFixingPush ? t('settings.fixingPush') : t('settings.fixPush')}
          </Button>
          <Button variant="outline" disabled={isTestingPush} onClick={() => void handleTestPush()}>
            <BellRing className="mr-2 h-4 w-4" />
            {isTestingPush ? t('settings.testingPush') : t('settings.testPush')}
          </Button>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/30 px-4 py-3">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">{t('settings.pushHelp')}</p>
        </div>
      </section>
      ) : null}
    </div>
  );
}
