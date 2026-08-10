'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useTranslation } from '@/context/LocaleProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { getNavItem } from '@/lib/navigation';
import { Logo } from './Logo';
import { AppearanceControls } from './AppearanceControls';
import { UserMenu } from './UserMenu';
import { Menu } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { signOutUser } = useAuth();
  const { t } = useTranslation();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const currentPage = getNavItem(pathname);

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-14 items-center gap-2 px-4 sm:h-16 sm:gap-3 sm:px-8">
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="shrink-0 sm:hidden">
              <Menu className="h-4 w-4" />
              <span className="sr-only">{t('common.menu')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-64 flex-col border-r-0 p-0">
            <div className="px-5 py-4">
              <Link
                href="/"
                className="flex items-center gap-2.5"
                onClick={() => setSheetOpen(false)}
              >
                <Logo size="md" />
                <span className="font-headline text-sm font-semibold">{t('app.name')}</span>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarNav onLinkClick={() => setSheetOpen(false)} />
            </div>
            <div className="mt-auto border-t border-border/40 px-3 py-4">
              <UserMenu onNavigate={() => setSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1 sm:hidden">
          <p className="truncate font-headline text-sm font-semibold">
            {t(currentPage.labelKey)}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <AppearanceControls />
          <Button variant="outline" size="sm" onClick={() => signOutUser()}>
            <LogOut className="mr-2 h-3.5 w-3.5" />
            {t('common.signOut')}
          </Button>
        </div>
      </div>
    </header>
  );
}
