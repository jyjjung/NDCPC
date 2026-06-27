'use client';

import Link from 'next/link';
import { useTranslation } from '@/context/LocaleProvider';
import { SidebarNav } from './SidebarNav';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col bg-background/80 backdrop-blur-sm sm:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size="md" priority />
          <span className="font-headline text-sm font-semibold text-foreground">{t('app.name')}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pt-2">
        <SidebarNav />
      </div>
      <div className="flex h-[5.25rem] shrink-0 items-center border-t border-border/40 p-3">
        <UserMenu className="w-full" />
      </div>
    </aside>
  );
}
