'use client';

import { useState } from 'react';
import { CornerUpLeft, SmilePlus, Trash2 } from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import type { MessageGroupPosition } from '@/lib/chat-message-meta';
import { getMessageGroupPosition, isChatMessageDeleted } from '@/lib/chat-message-meta';
import type { TranslationKey } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const CHAT_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'] as const;

function MessageActions({
  isOwn,
  onReply,
  onReact,
  onDelete,
  t,
}: {
  isOwn: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onDelete?: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const [reactOpen, setReactOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-px self-end pb-1 opacity-60 transition-opacity hover:opacity-100">
      <Popover open={reactOpen} onOpenChange={setReactOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label={t('chat.react')}
          >
            <SmilePlus className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="flex w-auto gap-0.5 rounded-full border border-border/60 p-1 shadow-md"
        >
          {CHAT_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(emoji);
                setReactOpen(false);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-base transition-colors hover:bg-muted"
              aria-label={`${t('chat.react')} ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={onReply}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        aria-label={t('chat.reply')}
      >
        <CornerUpLeft className="h-3 w-3" />
      </button>
      {isOwn && onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={t('chat.delete')}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

type ChatMessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  groupPosition: MessageGroupPosition;
  currentUid?: string;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onDelete?: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

export function ChatMessageBubble({
  message,
  isOwn,
  groupPosition,
  currentUid,
  onReply,
  onReact,
  onDelete,
  t,
}: ChatMessageBubbleProps) {
  const isDeleted = isChatMessageDeleted(message);
  const reactionEntries = isDeleted
    ? []
    : Object.entries(message.reactions ?? {}).filter(([, uids]) => uids.length > 0);

  return (
    <div
      className={cn(
        'flex w-max max-w-full items-end gap-1',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className="relative w-max max-w-[min(100%,16rem)] sm:max-w-xs">
        <div
          className={cn(
            'chat-bubble w-max max-w-full overflow-hidden px-3 py-[5px] text-[15px] leading-snug',
            isOwn
              ? groupPosition === 'single' || groupPosition === 'last'
                ? 'chat-bubble-own-tail'
                : null
              : groupPosition === 'single' || groupPosition === 'last'
                ? 'chat-bubble-other-tail'
                : null,
            isDeleted
              ? isOwn
                ? 'bg-primary/40 text-primary-foreground/80'
                : 'bg-muted/70 text-muted-foreground'
              : isOwn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
            reactionEntries.length > 0 && 'mb-2'
          )}
        >
          {isDeleted ? (
            <span className="italic">{t('chat.messageDeleted')}</span>
          ) : (
            <>
              {message.replyTo ? (
                <div
                  className={cn(
                    'mb-1 rounded-md border-l-2 px-2 py-0.5 text-[11px] leading-tight',
                    isOwn
                      ? 'border-primary-foreground/40 bg-primary-foreground/10'
                      : 'border-primary/40 bg-background/40 text-muted-foreground'
                  )}
                >
                  <p className="font-medium text-foreground/90">{message.replyTo.authorName}</p>
                  <p className="truncate opacity-80">{message.replyTo.text}</p>
                </div>
              ) : null}
              <span className="whitespace-pre-wrap break-words">{message.text}</span>
            </>
          )}
        </div>

        {reactionEntries.length > 0 ? (
          <div
            className={cn(
              'absolute bottom-0 z-10 flex flex-wrap gap-0.5',
              isOwn ? 'right-2 translate-y-1/2' : 'left-2 translate-y-1/2'
            )}
          >
            {reactionEntries.map(([emoji, uids]) => {
              const hasOwn = currentUid ? uids.includes(currentUid) : false;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(emoji)}
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full border bg-card px-1.5 py-px text-[11px] shadow-sm transition-colors',
                    hasOwn
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border/60 hover:bg-muted/60'
                  )}
                >
                  <span>{emoji}</span>
                  {uids.length > 1 ? (
                    <span className="font-medium text-muted-foreground">{uids.length}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {!isDeleted ? (
        <MessageActions
          isOwn={isOwn}
          onReply={onReply}
          onReact={onReact}
          onDelete={onDelete}
          t={t}
        />
      ) : null}
    </div>
  );
}

type ChatMessageGroupProps = {
  messages: ChatMessage[];
  indices: number[];
  isOwn: boolean;
  currentUid?: string;
  seenNames: string[];
  dateLabel?: string | null;
  timeLabel?: string | null;
  onReply: (message: ChatMessage) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onDelete?: (message: ChatMessage) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

export function ChatMessageGroupView({
  messages,
  indices,
  isOwn,
  currentUid,
  seenNames,
  dateLabel,
  timeLabel,
  onReply,
  onReact,
  onDelete,
  t,
}: ChatMessageGroupProps) {
  const firstMessage = messages[indices[0]!];

  return (
    <div>
      {dateLabel ? (
        <div className="mb-3 flex justify-center">
          <span className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {dateLabel}
          </span>
        </div>
      ) : null}
      {!dateLabel && timeLabel ? (
        <p className="mb-1.5 text-center text-[11px] text-muted-foreground">{timeLabel}</p>
      ) : null}

      {!isOwn ? (
        <p className="mb-1 px-2 text-[11px] font-medium text-muted-foreground">
          {firstMessage.authorName}
        </p>
      ) : null}

      <div className={cn('flex px-1', isOwn ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'flex w-max min-w-0 max-w-[85%] flex-col gap-1.5',
            isOwn ? 'ml-auto items-end' : 'items-start'
          )}
        >
          {indices.map((index) => {
            const message = messages[index]!;
            return (
              <ChatMessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                groupPosition={getMessageGroupPosition(messages, index)}
                currentUid={currentUid}
                onReply={() => onReply(message)}
                onReact={(emoji) => onReact(message, emoji)}
                onDelete={isOwn && onDelete ? () => onDelete(message) : undefined}
                t={t}
              />
            );
          })}
        </div>
      </div>

      {isOwn && seenNames.length > 0 ? (
        <p className="mt-0.5 px-2 text-right text-[11px] text-muted-foreground">
          {seenNames.join(', ')}
        </p>
      ) : null}
    </div>
  );
}
