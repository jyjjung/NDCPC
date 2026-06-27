'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PublicShell } from '@/components/PublicShell';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/AuthProvider';
import { useTranslation } from '@/context/LocaleProvider';

export default function PendingPage() {
  const { user, isApproved, isLoading, signOutUser } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/welcome');
    if (isApproved) router.replace('/');
  }, [user, isApproved, isLoading, router]);

  if (isLoading || !user || isApproved) {
    return <LoadingState />;
  }

  return (
    <PublicShell title={t('auth.pendingTitle')}>
      <div className="space-y-6">
        <p className="text-muted-foreground">{t('auth.pendingDescription')}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => signOutUser()}>
            {t('common.signOut')}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/welcome">{t('common.back')}</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
