'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LocaleProvider';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  priority?: boolean;
}

const sizes = {
  sm: 32,
  md: 36,
  lg: 48,
} as const;

export function Logo({ size = 'md', className, priority = false }: LogoProps) {
  const { t } = useTranslation();
  const dimension = sizes[size];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg bg-background',
        className
      )}
      style={{ width: dimension, height: dimension }}
    >
      <Image
        src="/icons/icon-192.png"
        alt={t('app.logoAlt')}
        width={Math.round(dimension * 0.82)}
        height={Math.round(dimension * 0.82)}
        priority={priority}
        className="object-contain"
      />
    </span>
  );
}
