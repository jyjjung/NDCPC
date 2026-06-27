'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { AppearanceControls } from './AppearanceControls';
import { useTranslation } from '@/context/LocaleProvider';
import { BackLink } from './BackLink';

export function PublicShell({
  children,
  title,
  backHref,
}: {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/welcome" className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="font-headline text-sm font-semibold">{t('app.name')}</span>
          </Link>
          <AppearanceControls />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        {backHref ? <BackLink href={backHref} className="mb-6" /> : null}
        {title ? (
          <h1 className="mb-8 font-headline text-3xl font-semibold tracking-tight">{title}</h1>
        ) : null}
        {children}
      </main>
    </div>
  );
}
