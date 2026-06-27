'use client';

import { useAuth } from '@/context/AuthProvider';
import { UserApprovalManager } from '@/components/UserApprovalManager';
import { AdminRoleManager } from '@/components/AdminRoleManager';
import { PageShell } from '@/components/PageShell';
import { EmptyState } from '@/components/EmptyState';
import { useTranslation } from '@/context/LocaleProvider';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();

  if (!isAdmin) {
    return (
      <PageShell title={t('nav.admin')}>
        <EmptyState message={t('adminPortal.accessDenied')} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t('nav.admin')}>
      <div className="space-y-10">
        <section className="space-y-4">
          <div>
            <h2 className="font-headline text-lg font-semibold">{t('adminPortal.pendingTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('adminPortal.pendingHint')}</p>
          </div>
          <UserApprovalManager />
        </section>
        <AdminRoleManager />
      </div>
    </PageShell>
  );
}
