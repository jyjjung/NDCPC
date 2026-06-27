'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { UserAvatar } from './UserAvatar';
import { cn } from '@/lib/utils';

type UserMenuProps = {
  className?: string;
  onNavigate?: () => void;
};

export function UserMenu({ className, onNavigate }: UserMenuProps) {
  const { profile, user } = useAuth();
  const name = profile?.displayName ?? user?.displayName ?? 'Member';
  const email = profile?.email ?? user?.email ?? '';

  return (
    <Link
      href="/settings"
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 px-3 py-2.5 transition-colors hover:bg-muted/40',
        className
      )}
    >
      <UserAvatar size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
