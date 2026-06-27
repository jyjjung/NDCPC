import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();

const db = getFirestore();

export const notifyChatMessage = onDocumentCreated('chatMessages/{messageId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const message = snapshot.data();
  const authorUid = message.authorUid as string | undefined;
  const authorName = (message.authorName as string | undefined) ?? 'Someone';
  const text = (message.text as string | undefined) ?? '';

  if (!authorUid || !text) return;

  const tokensSnap = await db.collectionGroup('fcmTokens').get();
  const tokens: string[] = [];

  for (const tokenDoc of tokensSnap.docs) {
    const userId = tokenDoc.ref.parent.parent?.id;
    if (!userId || userId === authorUid) continue;

    const userSnap = await db.collection('users').doc(userId).get();
    const prefs = userSnap.data()?.notificationPrefs as { chat?: boolean } | undefined;
    if (prefs?.chat === false) continue;

    const token = tokenDoc.data().token as string | undefined;
    if (token) tokens.push(token);
  }

  if (tokens.length === 0) return;

  const body = text.length > 120 ? `${text.slice(0, 120)}…` : text;
  const chunkSize = 500;

  for (let index = 0; index < tokens.length; index += chunkSize) {
    const chunk = tokens.slice(index, index + chunkSize);
    await getMessaging().sendEachForMulticast({
      tokens: chunk,
      notification: {
        title: `${authorName} · Church Chat`,
        body,
      },
      data: {
        url: '/chat',
      },
      webpush: {
        fcmOptions: {
          link: '/chat',
        },
      },
    });
  }
});
