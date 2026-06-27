'use client';

import { ScheduleManager } from '@/components/ScheduleManager';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function RosterPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t('nav.roster')} wide>
      <ScheduleManager />
    </PageShell>
  );
}
