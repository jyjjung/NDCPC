'use client';

import { DashboardView } from '@/components/DashboardView';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t('nav.home')}>
      <DashboardView />
    </PageShell>
  );
}
