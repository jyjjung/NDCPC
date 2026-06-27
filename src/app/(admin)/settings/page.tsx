'use client';

import { SettingsView } from '@/components/SettingsView';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t('nav.settings')}>
      <SettingsView />
    </PageShell>
  );
}
