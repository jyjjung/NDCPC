'use client';

import { useState } from 'react';
import { useAdmin } from '@/context/AuthProvider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Schedule } from '@/lib/types';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScheduleForm } from './ScheduleForm';
import { Plus, Trash2, Edit, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { VolunteerManager } from './VolunteerManager';
import { ScheduleTable } from './ScheduleTable';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/LocaleProvider';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

export function ScheduleManager() {
  const { isAdmin } = useAdmin();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [isVolunteerManagerOpen, setIsVolunteerManagerOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ndcpcSchedules'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: schedules, isLoading } = useCollection<Schedule>(schedulesQuery);

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setIsScheduleFormOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsScheduleFormOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: t('common.offline') });
      return;
    }
    try {
      await deleteDoc(doc(firestore, 'ndcpcSchedules', scheduleId));
      toast({ title: t('toast.deleted') });
    } catch (error) {
      console.error('Error deleting schedule: ', error);
      toast({ variant: 'destructive', title: t('toast.couldntDelete') });
    }
  };

  const handleFormSuccess = () => {
    setIsScheduleFormOpen(false);
    setEditingSchedule(null);
  };

  return (
    <div>
      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsVolunteerManagerOpen(true)}>
            <Users className="mr-1.5 h-4 w-4" />
            {t('schedules.volunteers')}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleAddSchedule}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t('common.add')}
          </Button>
        </div>
      )}

      {isLoading && <LoadingState />}

      {!isLoading && (!schedules || schedules.length === 0) && (
        <EmptyState message={t('common.empty')} />
      )}

      {!isLoading && schedules && schedules.length > 0 && (
        <ScheduleTable
          schedules={schedules}
          variant="full"
          actions={
            isAdmin
              ? (schedule) => (
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span className="sr-only">{t('common.edit')}</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">{t('common.delete')}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('announcements.deleteConfirm')}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )
              : undefined
          }
        />
      )}

      <Dialog open={isScheduleFormOpen} onOpenChange={setIsScheduleFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? t('common.edit') : t('schedules.add')}
            </DialogTitle>
          </DialogHeader>
          <ScheduleForm
            key={editingSchedule?.id || 'new'}
            onSuccess={handleFormSuccess}
            schedule={editingSchedule}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isVolunteerManagerOpen} onOpenChange={setIsVolunteerManagerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('schedules.volunteers')}</DialogTitle>
          </DialogHeader>
          <VolunteerManager />
        </DialogContent>
      </Dialog>
    </div>
  );
}
