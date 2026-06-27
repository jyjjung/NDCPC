'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/context/LocaleProvider';
import { cn } from '@/lib/utils';

export function BackLink({ href, className }: { href: string; className?: string }) {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {t('common.back')}
    </Link>
  );
}
