'use client';

import { useAdmin } from '@/context/AuthProvider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Volunteer } from '@/lib/types';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { VolunteerForm } from './VolunteerForm';
import { DATA_CACHE_KEYS } from '@/lib/data-cache';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ContentFlow, FlowItem } from './ContentFlow';
import { useTranslation } from '@/context/LocaleProvider';

export function RosterManager() {
  const { isAdmin } = useAdmin();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const volunteersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'volunteers'), orderBy('name'));
  }, [firestore]);

  const { data: volunteers, isLoading } = useCollection<Volunteer>(volunteersQuery, {
    cacheKey: DATA_CACHE_KEYS.volunteers,
  });

  const handleDelete = async (volunteer: Volunteer) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'volunteers', volunteer.id));
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {isAdmin && <VolunteerForm onSuccess={() => undefined} />}

      {!volunteers || volunteers.length === 0 ? (
        <EmptyState message={t('volunteers.empty')} />
      ) : (
        <ContentFlow>
          {volunteers.map((volunteer) => (
            <FlowItem key={volunteer.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{volunteer.name}</span>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">{t('common.remove')}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('volunteers.removeConfirm', { name: volunteer.name })}
                        </AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(volunteer)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {t('common.remove')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </FlowItem>
          ))}
        </ContentFlow>
      )}
    </div>
  );
}
