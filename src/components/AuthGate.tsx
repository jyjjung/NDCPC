'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { PUBLIC_PATHS } from '@/lib/constants';
import { LoadingState } from './LoadingState';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isApproved, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/welcome');
      return;
    }

    if (!isApproved && pathname !== '/pending') {
      router.replace('/pending');
    }
  }, [user, isApproved, isLoading, pathname, router]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user || !isApproved) {
    return <LoadingState />;
  }

  return <>{children}</>;
}

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
