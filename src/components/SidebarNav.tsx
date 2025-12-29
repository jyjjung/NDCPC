
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Library, CalendarDays, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Resources', icon: Library },
  { href: '/schedules', label: 'Schedules', icon: CalendarDays },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
];

interface SidebarNavProps {
  onLinkClick?: () => void;
}

export function SidebarNav({ onLinkClick }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2 px-4 text-sm font-medium">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            {
              'bg-muted text-primary': pathname === link.href,
            }
          )}
          onClick={onLinkClick}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
