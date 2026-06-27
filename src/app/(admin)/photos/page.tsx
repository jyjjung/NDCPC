'use client';

import { PhotoGallery } from '@/components/PhotoGallery';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function PhotosPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t('nav.photos')} wide>
      <PhotoGallery />
    </PageShell>
  );
}
