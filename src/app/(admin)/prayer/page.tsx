'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { PrayerTopicList } from '@/components/PrayerTopicList';
import { PrayerTopicForm } from '@/components/PrayerTopicForm';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function PrayerPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <PageShell
      title={t('nav.prayer')}
      actions={
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Plus className="mr-1.5 h-4 w-4" />
              {t('common.new')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('prayer.new')}</DialogTitle>
            </DialogHeader>
            <PrayerTopicForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      }
    >
      <PrayerTopicList />
    </PageShell>
  );
}
