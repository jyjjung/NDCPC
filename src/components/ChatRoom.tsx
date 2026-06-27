'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowUp, X } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { ChatMessage } from '@/lib/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { ChatMessageGroupView } from './ChatMessageBubble';
import { LoadingState } from './LoadingState';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/LocaleProvider';
import { formatAppDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import {
  formatChatDateSeparator,
  getChatMessageGroups,
  getGroupSpacingClass,
  getMessageDate,
  getReadReceiptNamesByMessageId,
  shouldShowDateSeparator,
} from '@/lib/chat-message-meta';

export function ChatRoom() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markedSeenRef = useRef<Set<string>>(new Set());

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'chatMessages'),
      orderBy('createdAt', 'asc'),
      limit(200)
    );
  }, [firestore]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!firestore || !user || !profile || !messages?.length) return;

    const pending = messages.filter(
      (message) =>
        message.authorUid !== user.uid &&
        !message.seenBy?.[user.uid] &&
        !markedSeenRef.current.has(message.id)
    );

    if (!pending.length) return;

    pending.forEach((message) => markedSeenRef.current.add(message.id));

    const batch = writeBatch(firestore);
    pending.forEach((message) => {
      batch.update(doc(firestore, 'chatMessages', message.id), {
        [`seenBy.${user.uid}`]: {
          name: profile.displayName,
          at: serverTimestamp(),
        },
      });
    });

    void batch.commit().catch((error) => {
      console.error(error);
      pending.forEach((message) => markedSeenRef.current.delete(message.id));
    });
  }, [firestore, messages, profile, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!firestore || !user || !profile) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSending(true);
    try {
      await addDoc(collection(firestore, 'chatMessages'), {
        text: trimmed,
        authorUid: user.uid,
        authorName: profile.displayName,
        createdAt: serverTimestamp(),
        ...(replyTo
          ? {
              replyTo: {
                messageId: replyTo.id,
                authorName: replyTo.authorName,
                text: replyTo.text.slice(0, 120),
              },
            }
          : {}),
      });
      setText('');
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntPost') });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (message: ChatMessage) => {
    if (!firestore || !user || message.authorUid !== user.uid) return;

    try {
      await deleteDoc(doc(firestore, 'chatMessages', message.id));
      if (replyTo?.id === message.id) setReplyTo(null);
      toast({ title: t('toast.deleted') });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntDelete') });
    }
  };

  const handleReact = async (message: ChatMessage, emoji: string) => {
    if (!firestore || !user) return;

    const nextReactions = { ...(message.reactions ?? {}) };
    let existingEmoji: string | null = null;

    for (const [reaction, uids] of Object.entries(nextReactions)) {
      if (uids.includes(user.uid)) {
        existingEmoji = reaction;
        break;
      }
    }

    for (const reaction of Object.keys(nextReactions)) {
      const filtered = nextReactions[reaction].filter((uid) => uid !== user.uid);
      if (filtered.length) nextReactions[reaction] = filtered;
      else delete nextReactions[reaction];
    }

    if (existingEmoji !== emoji) {
      nextReactions[emoji] = [...(nextReactions[emoji] ?? []), user.uid];
    }

    try {
      await updateDoc(doc(firestore, 'chatMessages', message.id), {
        reactions: nextReactions,
      });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntPost') });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  const canSend = text.trim().length > 0 && !isSending;
  const readReceiptNamesByMessageId = user
    ? getReadReceiptNamesByMessageId(messages ?? [], user.uid)
    : new Map<string, string[]>();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex-1 overflow-y-auto px-2 py-3 sm:px-3">
        {!messages || messages.length === 0 ? (
          <p className="pt-12 text-center text-sm text-muted-foreground">{t('chat.empty')}</p>
        ) : (
          <div>
            {getChatMessageGroups(messages).map((group) => {
              const startIndex = group.indices[0]!;
              const lastIndex = group.indices[group.indices.length - 1]!;
              const firstMessage = messages[startIndex]!;
              const lastMessage = messages[lastIndex]!;
              const isOwn = firstMessage.authorUid === user?.uid;
              const messageDate = getMessageDate(firstMessage);
              const showDate = shouldShowDateSeparator(messages, startIndex);
              const timeLabel = messageDate
                ? formatAppDate(messageDate, 'p', locale)
                : null;
              const dateLabel =
                showDate && messageDate
                  ? `${formatChatDateSeparator(messageDate, locale, t)}${timeLabel ? ` · ${timeLabel}` : ''}`
                  : null;
              const seenNames = readReceiptNamesByMessageId.get(lastMessage.id) ?? [];

              return (
                <div
                  key={group.indices.map((i) => messages[i]!.id).join('-')}
                  className={getGroupSpacingClass(messages, startIndex)}
                >
                  <ChatMessageGroupView
                    messages={messages}
                    indices={group.indices}
                    isOwn={isOwn}
                    currentUid={user?.uid}
                    seenNames={seenNames}
                    dateLabel={dateLabel}
                    timeLabel={showDate ? null : timeLabel}
                    onReply={(message) => {
                      setReplyTo(message);
                      inputRef.current?.focus();
                    }}
                    onReact={(message, emoji) => void handleReact(message, emoji)}
                    onDelete={isOwn ? (message) => void handleDelete(message) : undefined}
                    t={t}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-border/40 bg-background">
        {replyTo ? (
          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
            <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
              <p className="text-[11px] font-medium text-muted-foreground">
                {t('chat.replyingTo', { name: replyTo.authorName })}
              </p>
              <p className="truncate text-sm">{replyTo.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t('chat.cancelReply')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex h-[5.25rem] items-center gap-2 px-3"
        >
          <div className="flex h-9 flex-1 items-center rounded-full border border-border/60 bg-muted/40 px-4">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t('chat.placeholder')}
              autoComplete="off"
              enterKeyHint="send"
              className="h-full w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t('chat.send')}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
              canSend
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <ArrowUp className="h-5 w-5 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
}
