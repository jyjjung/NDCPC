'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  Heart,
  ImageIcon,
  LayoutDashboard,
  Library,
  ListMusic,
  Megaphone,
  MessageCircle,
  Shield,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { navLinks } from '@/lib/navigation';
import { useTranslation } from '@/context/LocaleProvider';
import { useAuth } from '@/context/AuthProvider';

const icons = {
  '/': LayoutDashboard,
  '/announcements': Megaphone,
  '/prayer': Heart,
  '/chat': MessageCircle,
  '/photos': ImageIcon,
  '/setlist': ListMusic,
  '/resources': Library,
  '/roster': Users,
  '/schedule': CalendarDays,
  '/admin': Shield,
} as const;

interface SidebarNavProps {
  onLinkClick?: () => void;
}

export function SidebarNav({ onLinkClick }: SidebarNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const links = navLinks.filter((link) => link.href !== '/admin' || isAdmin);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="space-y-0.5">
      {links.map((link) => {
        const Icon = icons[link.href];
        const active = isActive(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              active
                ? 'font-medium text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={onLinkClick}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
