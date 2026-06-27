'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useAdmin } from '@/context/AuthProvider';
import { WorshipFormatManager } from '@/components/WorshipFormatManager';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';
import { LoadingState } from '@/components/LoadingState';

export default function SchedulePage() {
  const { isAdmin } = useAdmin();
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <PageShell
      title={t('nav.schedule')}
      wide
      actions={
        isAdmin ? (
          <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
            <Edit className="mr-1.5 h-4 w-4" />
            {t('common.edit')}
          </Button>
        ) : undefined
      }
    >
      <WorshipFormatManager editOpen={editOpen} onEditOpenChange={setEditOpen} />
    </PageShell>
  );
}
