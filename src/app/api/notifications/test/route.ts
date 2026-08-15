import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminFirestore, getAdminMessaging } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    getAdminApp();
    const idToken = authHeader.slice('Bearer '.length);
    const decoded = await getAuth().verifyIdToken(idToken);
    const db = getAdminFirestore();
    const messaging = getAdminMessaging();

    const userSnap = await db.collection('users').doc(decoded.uid).get();
    const tokens = [...new Set((userSnap.data()?.fcmTokens as string[] | undefined) ?? [])].filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({ error: 'No push tokens found. Use Fix push notifications first.' }, { status: 400 });
    }

    await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: 'Test notification',
        body: 'Push notifications are working for NDC Preschool Church.',
      },
      data: {
        url: '/settings',
      },
      webpush: {
        fcmOptions: {
          link: '/settings',
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Test notification failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test notification failed' },
      { status: 500 }
    );
  }
}
