import type { TranslationKey } from '@/i18n/translations';

export const navLinks = [
  { href: '/', labelKey: 'nav.home' as TranslationKey },
  { href: '/announcements', labelKey: 'nav.announcements' as TranslationKey },
  { href: '/prayer', labelKey: 'nav.prayer' as TranslationKey },
  { href: '/photos', labelKey: 'nav.photos' as TranslationKey },
  { href: '/setlist', labelKey: 'nav.setlist' as TranslationKey },
  { href: '/resources', labelKey: 'nav.resources' as TranslationKey },
  { href: '/roster', labelKey: 'nav.roster' as TranslationKey },
  { href: '/schedule', labelKey: 'nav.schedule' as TranslationKey },
  { href: '/admin', labelKey: 'nav.admin' as TranslationKey },
] as const;

export function getNavItem(pathname: string) {
  if (pathname === '/') {
    return navLinks[0];
  }
  return navLinks.find((link) => pathname.startsWith(link.href)) ?? navLinks[0];
}
