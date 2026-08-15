import { FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();

const db = getFirestore();

async function getUnreadChatCount(userId: string) {
  const snapshot = await db
    .collection('ndcpcChatMessages')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  return snapshot.docs.filter((messageDoc) => {
    const message = messageDoc.data();
    if (message.deleted === true) return false;
    if (message.authorUid === userId) return false;
    return !message.seenBy?.[userId];
  }).length;
}

function chatPrefEnabled(userData: FirebaseFirestore.DocumentData | undefined): boolean {
  const nested = userData?.preferences?.notifications?.ndcpc?.chat;
  if (nested === false) return false;
  const legacy = userData?.notificationPrefs?.chat;
  return legacy !== false;
}

function hasNdcpcAccess(userData: FirebaseFirestore.DocumentData | undefined): boolean {
  if (!userData?.isApproved && !userData?.approved) return false;
  return userData.access?.ndcpc === true;
}

export const notifyChatMessage = onDocumentCreated('ndcpcChatMessages/{messageId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const message = snapshot.data();
  const authorUid = message.authorUid as string | undefined;
  const authorName = (message.authorName as string | undefined) ?? 'Someone';
  const text = (message.text as string | undefined) ?? '';

  if (!authorUid || !text) return;

  const usersSnap = await db.collection('users').get();
  const tokensByUser = new Map<string, string[]>();

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    if (userId === authorUid) continue;

    const userData = userDoc.data();
    const approved = Boolean(userData.isApproved ?? userData.approved);
    if (!approved || !hasNdcpcAccess(userData) || !chatPrefEnabled(userData)) continue;

    const tokens = [...new Set((userData.fcmTokens as string[] | undefined) ?? [])].filter(Boolean);
    if (tokens.length === 0) continue;
    tokensByUser.set(userId, tokens);
  }

  if (tokensByUser.size === 0) return;

  const body = text.length > 120 ? `${text.slice(0, 120)}…` : text;
  for (const [userId, tokens] of tokensByUser) {
    const badgeCount = await getUnreadChatCount(userId);
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      data: {
        title: `${authorName} · NDC Preschool Chat`,
        body,
        url: '/chat',
        badge: String(badgeCount),
        tag: `ndcpc-chat-${snapshot.id}`,
        icon: '/icons/icon-192.png',
      },
      webpush: {
        headers: { Urgency: 'high' },
        fcmOptions: { link: '/chat' },
      },
    });

    const staleTokens: string[] = [];
    response.responses.forEach((result, index) => {
      const code = result.error?.code;
      if (
        result.success ||
        !code ||
        ![
          'messaging/registration-token-not-registered',
          'messaging/invalid-registration-token',
          'messaging/invalid-argument',
        ].includes(code)
      ) {
        return;
      }
      staleTokens.push(tokens[index]!);
    });

    if (staleTokens.length > 0) {
      await db.collection('users').doc(userId).update({
        fcmTokens: FieldValue.arrayRemove(...staleTokens),
      });
    }
  }
});

export const sendPushVerification = onDocumentCreated('pushTests/{requestId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  try {
    const userId = snapshot.data().userId as string | undefined;
    if (!userId) return;

    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    const approved = Boolean(userData?.isApproved ?? userData?.approved);
    if (!userSnap.exists || !approved) return;

    const tokens = [...new Set((userData?.fcmTokens as string[] | undefined) ?? [])].filter(Boolean);
    if (tokens.length === 0) {
      console.warn('Verification push skipped: no registered tokens', { userId });
      return;
    }

    const badgeCount = await getUnreadChatCount(userId);
    await getMessaging().sendEachForMulticast({
      tokens,
      data: {
        title: 'Notifications enabled',
        body: 'Push notifications are working on this device.',
        url: '/settings',
        badge: String(badgeCount),
        tag: `push-test-${snapshot.id}`,
        icon: '/icons/icon-192.png',
      },
      webpush: {
        headers: { Urgency: 'high' },
        fcmOptions: { link: '/settings' },
      },
    });
  } finally {
    await snapshot.ref.delete();
  }
});
