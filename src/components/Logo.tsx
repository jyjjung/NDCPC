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
    <Image
      src="/icons/icon-192.png"
      alt={t('app.logoAlt')}
      width={dimension}
      height={dimension}
      priority={priority}
      className={cn('shrink-0 rounded-lg object-contain', className)}
    />
  );
}
