'use client';

import { PublicShell } from '@/components/PublicShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <PublicShell title={t('privacy.title')} backHref="/welcome">
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">{t('privacy.collectionTitle')}</h2>
          <p>{t('privacy.collectionBody')}</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">{t('privacy.useTitle')}</h2>
          <p>{t('privacy.useBody')}</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">{t('privacy.storageTitle')}</h2>
          <p>{t('privacy.storageBody')}</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">{t('privacy.rightsTitle')}</h2>
          <p>{t('privacy.rightsBody')}</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-foreground">{t('privacy.contactTitle')}</h2>
          <p>{t('privacy.contactBody')}</p>
        </section>
        <p className="text-xs">{t('privacy.updated')}</p>
      </div>
    </PublicShell>
  );
}
