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
import { useAdmin } from '@/context/AuthProvider';
import { AnnouncementList } from '@/components/AnnouncementList';
import { AddAnnouncementForm } from '@/components/AddAnnouncementForm';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function AnnouncementsPage() {
  const { isAdmin } = useAdmin();
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <PageShell
      title={t('nav.announcements')}
      actions={
        isAdmin ? (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Plus className="mr-1.5 h-4 w-4" />
                {t('common.new')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('announcements.new')}</DialogTitle>
              </DialogHeader>
              <AddAnnouncementForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        ) : undefined
      }
    >
      <AnnouncementList />
    </PageShell>
  );
}
