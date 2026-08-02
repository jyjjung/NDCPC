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
  deleteField,
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
  isChatMessageDeleted,
  shouldShowDateSeparator,
} from '@/lib/chat-message-meta';
import { DATA_CACHE_KEYS } from '@/lib/data-cache';

export function ChatRoom() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const markedSeenRef = useRef<Set<string>>(new Set());
  const [footerHeight, setFooterHeight] = useState(0);
  const [isMobileComposer, setIsMobileComposer] = useState(false);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'chatMessages'),
      orderBy('createdAt', 'asc'),
      limit(200)
    );
  }, [firestore]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery, {
    cacheKey: DATA_CACHE_KEYS.chatMessages,
  });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const onScroll = () => {
      const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
      stickToBottomRef.current = distanceFromBottom < 96;
    };

    list.addEventListener('scroll', onScroll, { passive: true });
    return () => list.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobileComposer(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const updateHeight = () => setFooterHeight(footer.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(footer);
    return () => observer.disconnect();
  }, [replyTo]);

  useEffect(() => {
    const list = listRef.current;
    if (!stickToBottomRef.current || !list) return;
    list.scrollTop = list.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!firestore || !user || !profile || !messages?.length) return;

    const pending = messages.filter(
      (message) =>
        !isChatMessageDeleted(message) &&
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
      stickToBottomRef.current = true;
      requestAnimationFrame(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight;
      });
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
    if (isChatMessageDeleted(message)) return;

    const messageRef = doc(firestore, 'chatMessages', message.id);

    try {
      await updateDoc(messageRef, {
        deleted: true,
        text: '',
        replyTo: deleteField(),
        reactions: deleteField(),
      });
      if (replyTo?.id === message.id) setReplyTo(null);
      toast({ title: t('toast.deleted') });
    } catch (softDeleteError) {
      console.error(softDeleteError);
      // Fallback if soft-delete rules are not deployed yet.
      try {
        await deleteDoc(messageRef);
        if (replyTo?.id === message.id) setReplyTo(null);
        toast({ title: t('toast.deleted') });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: t('toast.couldntDelete') });
      }
    }
  };

  const handleReact = async (message: ChatMessage, emoji: string) => {
    if (!firestore || !user || isChatMessageDeleted(message)) return;

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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 items-center justify-center">
          <LoadingState />
        </div>
      </div>
    );
  }

  const canSend = text.trim().length > 0 && !isSending;
  const readReceiptNamesByMessageId = user
    ? getReadReceiptNamesByMessageId(messages ?? [], user.uid)
    : new Map<string, string[]>();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div
        ref={listRef}
        style={{
          paddingBottom:
            isMobileComposer && footerHeight > 0 ? footerHeight : undefined,
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y px-2 py-3 [-webkit-overflow-scrolling:touch] sm:px-3"
      >
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
                      if (isChatMessageDeleted(message)) return;
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
      </div>

      <div
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 z-10 shrink-0 touch-none border-t border-border/40 bg-background pb-[env(safe-area-inset-bottom)] sm:static sm:inset-auto sm:z-auto sm:touch-auto sm:pb-0"
      >
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
