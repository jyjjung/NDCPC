'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Resource, Setlist } from '@/lib/types';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Edit, Trash2 } from 'lucide-react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { normalizeSetlist, resolveSetlistResources } from '@/lib/setlist';
import { useTranslation } from '@/context/LocaleProvider';
import { formatAppDate } from '@/lib/format-date';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { SetlistForm } from './SetlistForm';
import { SetlistMedia } from './SetlistMedia';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SetlistManagerProps {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function SetlistManager({ createOpen, onCreateOpenChange }: SetlistManagerProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const [editingSetlist, setEditingSetlist] = useState<Setlist | null>(null);

  const setlistsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ndcpcSetlists'), orderBy('date', 'desc'));
  }, [firestore]);

  const resourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ndcpcResources'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: setlists, isLoading: setlistsLoading } = useCollection<Setlist>(setlistsQuery);
  const { data: resources } = useCollection<Resource>(resourcesQuery);

  const resourceMap = new Map(resources?.map((r) => [r.id, r]) ?? []);

  const formOpen = createOpen || !!editingSetlist;

  const handleDelete = async (setlistId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'ndcpcSetlists', setlistId));
      toast({ title: t('toast.deleted') });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntDelete') });
    }
  };

  const closeForm = () => {
    onCreateOpenChange(false);
    setEditingSetlist(null);
  };

  if (setlistsLoading) {
    return <LoadingState />;
  }

  return (
    <>
      {!setlists || setlists.length === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <Accordion type="single" collapsible>
          {setlists.map((setlist) => {
            const { songIds, chantIds } = normalizeSetlist(setlist, resourceMap);
            const songs = resolveSetlistResources(songIds, resourceMap);
            const chants = resolveSetlistResources(chantIds, resourceMap);
            const totalCount = songs.length + chants.length;

            return (
              <AccordionItem
                key={setlist.id}
                value={setlist.id}
                className="border-b border-border/40 last:border-0"
              >
                <div className="flex w-full items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <AccordionTrigger className="w-full py-4 text-left text-[0.9375rem] no-underline hover:no-underline">
                      <div className="space-y-0.5 text-left">
                        <p>
                          {setlist.date?.seconds
                            ? formatAppDate(
                                new Date(setlist.date.seconds * 1000),
                                'EEEE, MMMM d',
                                locale
                              )
                            : t('setlist.noDate')}
                        </p>
                        <p className="text-xs font-normal text-muted-foreground">
                          {t('setlist.summary', {
                            songs: songs.length,
                            chants: chants.length,
                          })}
                          {totalCount === 0 ? ` · ${t('setlist.noVideos')}` : ''}
                        </p>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSetlist(setlist);
                      }}
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
                          onClick={(e) => e.stopPropagation()}
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
                            onClick={() => handleDelete(setlist.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <AccordionContent>
                  {totalCount === 0 ? (
                    <p className="pb-4 text-sm text-muted-foreground">{t('setlist.noVideos')}</p>
                  ) : (
                    <div className="pb-4">
                      <SetlistMedia songs={songs} chants={chants} />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,720px)] min-h-0 max-w-xl flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {editingSetlist ? t('setlist.edit') : t('setlist.new')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <SetlistForm
              key={editingSetlist?.id ?? 'new'}
              setlist={editingSetlist}
              onSuccess={closeForm}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
