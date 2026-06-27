'use client';

import { RosterManager } from '@/components/RosterManager';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function RosterPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t('nav.roster')}>
      <RosterManager />
    </PageShell>
  );
}
