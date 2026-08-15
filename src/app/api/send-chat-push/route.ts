import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminFirestore, getAdminMessaging } from '@/lib/firebase-admin';
import { deliverNdcpcChatPush } from '@/lib/server-chat-push';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { messageId?: string; authorUid?: string; authorName?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messageId, authorUid, authorName, text } = body;
  if (!messageId || !authorUid || !authorName?.trim() || !text?.trim()) {
    return NextResponse.json({ error: 'messageId, authorUid, authorName, and text are required' }, { status: 400 });
  }

  try {
    getAdminApp();
    const decoded = await getAuth().verifyIdToken(authHeader.slice('Bearer '.length));
    if (decoded.uid !== authorUid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await deliverNdcpcChatPush(
      { messageId, authorUid, authorName: authorName.trim(), text },
      getAdminFirestore(),
      getAdminMessaging(),
    );

    if (result.reason === 'Already sent') {
      return NextResponse.json({ success: true, delivered: 0, alreadySent: true });
    }

    return NextResponse.json({
      success: true,
      delivered: result.delivered,
      skipped: result.skipped,
      reason: result.reason,
    });
  } catch (error) {
    console.error('[send-chat-push]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
