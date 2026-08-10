'use client';

import type { FirebaseApp } from 'firebase/app';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from 'firebase/messaging';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { NotificationPrefs, UserProfile } from '@/lib/types';

/** Requires `NEXT_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=true` plus a valid VAPID public key. */
export const PUSH_NOTIFICATIONS_ENABLED =
  process.env.NEXT_PUBLIC_PUSH_NOTIFICATIONS_ENABLED === 'true';

export function isPushNotificationsEnabled() {
  return PUSH_NOTIFICATIONS_ENABLED;
}

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();

/** Web Push needs the VAPID *public* key (~87 chars), not the shorter private key. */
function decodeBase64Url(key: string): Uint8Array | null {
  try {
    const padded = key.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function isValidVapidPublicKey(key: string | undefined): key is string {
  if (!key) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(key)) return false;
  if (key.length < 80 || key.length > 100) return false;

  const decoded = decodeBase64Url(key);
  if (!decoded) return false;
  // Uncompressed P-256 public key is 65 bytes; some consoles omit the 0x04 prefix (64 bytes).
  return decoded.length === 65 || decoded.length === 64;
}

let messagingPromise: Promise<Messaging | null> | null = null;

async function getMessagingInstance(app: FirebaseApp): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (!(await isSupported())) return null;

  if (!messagingPromise) {
    messagingPromise = Promise.resolve(getMessaging(app));
  }

  return messagingPromise;
}

export type PushRegistrationResult =
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'missing_vapid'
  | 'invalid_vapid';

export function isChatNotificationsEnabled(profile: UserProfile | null | undefined) {
  return profile?.notificationPrefs?.chat !== false;
}

export async function updateChatNotificationPref(
  firestore: Firestore,
  uid: string,
  enabled: boolean
) {
  const notificationPrefs: NotificationPrefs = { chat: enabled };
  await updateDoc(doc(firestore, 'users', uid), { notificationPrefs });
}

export async function registerPushNotifications(
  app: FirebaseApp,
  firestore: Firestore,
  uid: string,
  forceRefresh = false
): Promise<PushRegistrationResult> {
  if (!PUSH_NOTIFICATIONS_ENABLED) return 'unsupported';
  if (!VAPID_KEY) return 'missing_vapid';
  if (!isValidVapidPublicKey(VAPID_KEY)) return 'invalid_vapid';

  const messaging = await getMessagingInstance(app);
  if (!messaging) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/',
  });
  await registration.update();

  let token: string | null = null;
  try {
    if (forceRefresh) {
      await deleteToken(messaging).catch(() => false);
    }
    token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch (error) {
    console.error('FCM getToken failed:', error);
    if (!isValidVapidPublicKey(VAPID_KEY)) return 'invalid_vapid';
    throw error;
  }

  if (!token) return 'denied';

  await setDoc(doc(firestore, 'users', uid, 'fcmTokens', token), {
    token,
    updatedAt: serverTimestamp(),
  });

  return 'granted';
}

export async function fixPushNotifications(
  app: FirebaseApp,
  firestore: Firestore,
  uid: string
): Promise<PushRegistrationResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  return registerPushNotifications(app, firestore, uid, true);
}

export async function requestPushVerification(firestore: Firestore, uid: string) {
  if (!PUSH_NOTIFICATIONS_ENABLED) {
    throw new Error('Push notifications are disabled');
  }

  await addDoc(collection(firestore, 'pushTests'), {
    userId: uid,
    createdAt: serverTimestamp(),
  });
}

export function listenForForegroundMessages(
  app: FirebaseApp,
  onPayload: (payload: {
    notification?: { title?: string; body?: string };
    data?: {
      title?: string;
      body?: string;
      url?: string;
      badge?: string;
      tag?: string;
      icon?: string;
    };
  }) => void,
  enabled = true
) {
  if (!PUSH_NOTIFICATIONS_ENABLED || !enabled) return () => {};

  let unsubscribe = () => {};

  void getMessagingInstance(app).then((messaging) => {
    if (!messaging) return;
    unsubscribe = onMessage(messaging, onPayload);
  });

  return () => unsubscribe();
}
