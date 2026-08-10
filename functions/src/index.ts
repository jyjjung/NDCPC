import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();

const db = getFirestore();

async function getUnreadChatCount(userId: string) {
  const snapshot = await db
    .collection('chatMessages')
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

export const notifyChatMessage = onDocumentCreated('chatMessages/{messageId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const message = snapshot.data();
  const authorUid = message.authorUid as string | undefined;
  const authorName = (message.authorName as string | undefined) ?? 'Someone';
  const text = (message.text as string | undefined) ?? '';

  if (!authorUid || !text) return;

  const tokensSnap = await db.collectionGroup('fcmTokens').get();
  const tokensByUser = new Map<string, string[]>();

  for (const tokenDoc of tokensSnap.docs) {
    const userId = tokenDoc.ref.parent.parent?.id;
    if (!userId || userId === authorUid) continue;

    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    if (!userSnap.exists || userData?.approved !== true) continue;

    const prefs = userData?.notificationPrefs as { chat?: boolean } | undefined;
    if (prefs?.chat === false) continue;

    const token = tokenDoc.data().token as string | undefined;
    if (!token) continue;
    tokensByUser.set(userId, [...(tokensByUser.get(userId) ?? []), token]);
  }

  if (tokensByUser.size === 0) return;

  const body = text.length > 120 ? `${text.slice(0, 120)}…` : text;
  for (const [userId, tokens] of tokensByUser) {
    const badgeCount = await getUnreadChatCount(userId);
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      data: {
        title: `${authorName} · Church Chat`,
        body,
        url: '/chat',
        badge: String(badgeCount),
        tag: `chat-${snapshot.id}`,
        icon: '/icons/icon-192.png',
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        fcmOptions: {
          link: '/chat',
        },
      },
    });
    console.log('Chat push result', {
      userId,
      success: response.successCount,
      failure: response.failureCount,
    });

    await Promise.all(
      response.responses.map(async (result, index) => {
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
        await db
          .collection('users')
          .doc(userId)
          .collection('fcmTokens')
          .doc(tokens[index])
          .delete();
      })
    );
  }
});

export const sendPushVerification = onDocumentCreated('pushTests/{requestId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  try {
    const userId = snapshot.data().userId as string | undefined;
    if (!userId) return;

    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists || userSnap.data()?.approved !== true) return;

    const tokensSnap = await db
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();
    const tokens = tokensSnap.docs
      .map((tokenDoc) => tokenDoc.data().token as string | undefined)
      .filter((token): token is string => Boolean(token));

    if (tokens.length === 0) {
      console.warn('Verification push skipped: no registered tokens', { userId });
      return;
    }

    const badgeCount = await getUnreadChatCount(userId);
    const response = await getMessaging().sendEachForMulticast({
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
        headers: {
          Urgency: 'high',
        },
        fcmOptions: {
          link: '/settings',
        },
      },
    });
    console.log('Verification push result', {
      userId,
      success: response.successCount,
      failure: response.failureCount,
      errors: response.responses
        .filter((result) => !result.success)
        .map((result) => result.error?.code),
    });
  } finally {
    await snapshot.ref.delete();
  }
});
