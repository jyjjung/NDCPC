'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadPhoto, getCachedPhotoBlob } from '@/lib/photo-cache';
import { useTranslation } from '@/context/LocaleProvider';

type CachedPhotoProps = {
  url: string;
  alt: string;
  filename: string;
};

export function CachedPhoto({ url, alt, filename }: CachedPhotoProps) {
  const { t } = useTranslation();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let localUrl: string | null = null;

    getCachedPhotoBlob(url)
      .then((blob) => {
        if (!active) return;
        localUrl = URL.createObjectURL(blob);
        setObjectUrl(localUrl);
      })
      .catch(() => {
        if (active) setObjectUrl(url);
      });

    return () => {
      active = false;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [url]);

  if (!objectUrl) {
    return <div className="aspect-[4/3] animate-pulse rounded-lg bg-muted/40" />;
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted/30">
        <Image src={objectUrl} alt={alt} fill className="object-cover" unoptimized />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm">{alt}</p>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => downloadPhoto(url, filename)}
        >
          <Download className="mr-1.5 h-4 w-4" />
          {t('photos.download')}
        </Button>
      </div>
    </div>
  );
}
