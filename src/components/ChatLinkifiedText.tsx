'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { URL_REGEX, normalizeChatUrl } from '@/lib/chat-url-utils';
import { cn } from '@/lib/utils';

export function ChatLinkifiedText({
  text,
  isOwn,
  className,
}: {
  text: string;
  isOwn: boolean;
  className?: string;
}) {
  const content = useMemo(
    () =>
      text.split(URL_REGEX).map((part, index) => {
        if (!part) return null;
        if (!/^(https?:\/\/[^\s]+|www\.[^\s]+)$/i.test(part)) return part;

        const href = normalizeChatUrl(part);
        const linkClassName = cn(
          'break-all font-medium underline decoration-current/40 underline-offset-2',
          isOwn ? 'text-primary-foreground' : 'text-primary'
        );

        try {
          const url = new URL(href);
          if (typeof window !== 'undefined' && url.host === window.location.host) {
            return (
              <Link
                key={`${href}-${index}`}
                href={`${url.pathname}${url.search}${url.hash}`}
                className={linkClassName}
              >
                {part}
              </Link>
            );
          }
        } catch {
          return part;
        }

        return (
          <a
            key={`${href}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {part}
          </a>
        );
      }),
    [isOwn, text]
  );

  return (
    <span className={cn('whitespace-pre-wrap break-words leading-snug', className)}>
      {content}
    </span>
  );
}
