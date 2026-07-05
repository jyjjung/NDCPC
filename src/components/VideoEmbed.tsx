'use client';

import { getVideoEmbedUrl } from '@/lib/video';

type VideoEmbedProps = {
  url: string;
  title: string;
  className?: string;
  startSeconds?: number;
  endSeconds?: number;
};

export function VideoEmbed({
  url,
  title,
  className,
  startSeconds,
  endSeconds,
}: VideoEmbedProps) {
  const embedUrl = getVideoEmbedUrl(url, { startSeconds, endSeconds });

  return (
    <div className={className ?? 'aspect-video w-full overflow-hidden rounded-md bg-muted/30'}>
      {embedUrl ? (
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <iframe src={url} className="h-full w-full" title={title} />
      )}
    </div>
  );
}
