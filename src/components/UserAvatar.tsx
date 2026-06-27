'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthProvider';

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

type UserAvatarProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
} as const;

export function UserAvatar({ size = 'md', className }: UserAvatarProps) {
  const { profile, user } = useAuth();
  const name = profile?.displayName ?? user?.displayName ?? 'Member';
  const photoURL = profile?.photoURL ?? user?.photoURL ?? undefined;

  return (
    <Avatar className={cn(sizes[size], className)}>
      <AvatarImage src={photoURL} alt={name} />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
