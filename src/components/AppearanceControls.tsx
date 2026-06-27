'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useLocale } from '@/context/LocaleProvider';
import type { Locale } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function AppearanceControls({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn('h-8 w-[4.5rem]', className)} aria-hidden />;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className="flex rounded-md border border-border/60 p-0.5"
        role="group"
        aria-label={t('appearance.language')}
      >
        {(['en', 'ko'] as Locale[]).map((code) => (
          <Button
            key={code}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-2 text-xs font-medium',
              locale === code && 'bg-accent text-accent-foreground'
            )}
            onClick={() => setLocale(code)}
          >
            {code === 'en' ? 'ENG' : 'KOR'}
          </Button>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : theme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
            <span className="sr-only">{t('appearance.theme')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('appearance.theme')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <Sun className="mr-2 h-4 w-4" />
              {t('appearance.themeLight')}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="mr-2 h-4 w-4" />
              {t('appearance.themeDark')}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor className="mr-2 h-4 w-4" />
              {t('appearance.themeSystem')}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
