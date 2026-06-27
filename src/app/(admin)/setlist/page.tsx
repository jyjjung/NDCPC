'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SetlistManager } from '@/components/SetlistManager';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function SetlistPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <PageShell
      title={t('nav.setlist')}
      wide
      actions={
        <Button size="sm" variant="ghost" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('common.new')}
        </Button>
      }
    >
      <SetlistManager createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </PageShell>
  );
}
