'use client';

import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useCollection, useFirestore, useMemoFirebase, useStorage } from '@/firebase';
import { Photo } from '@/lib/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { CachedPhoto } from './CachedPhoto';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/LocaleProvider';

export function PhotoGallery() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [captionDialog, setCaptionDialog] = useState<{ photoId: string; caption: string } | null>(
    null
  );
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const photosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'photos'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: photos, isLoading } = useCollection<Photo>(photosQuery);

  const handleUpload = async (file: File) => {
    if (!firestore || !storage || !user || !profile) return;

    setIsUploading(true);
    try {
      const storagePath = `photos/${user.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      const docRef = await addDoc(collection(firestore, 'photos'), {
        storagePath,
        downloadUrl,
        uploadedBy: user.uid,
        uploadedByName: profile.displayName,
        caption: '',
        createdAt: serverTimestamp(),
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
      setCaptionDialog({ photoId: docRef.id, caption: '' });
      toast({ title: t('photos.uploaded') });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    } finally {
      setIsUploading(false);
    }
  };

  const saveCaption = async () => {
    if (!firestore || !captionDialog) return;

    setIsSavingCaption(true);
    try {
      await updateDoc(doc(firestore, 'photos', captionDialog.photoId), {
        caption: captionDialog.caption.trim(),
      });
      setCaptionDialog(null);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    } finally {
      setIsSavingCaption(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!firestore || !storage || !user || photo.uploadedBy !== user.uid) return;

    setDeletingPhotoId(photo.id);
    try {
      if (photo.storagePath) {
        await deleteObject(ref(storage, photo.storagePath));
      }
      await deleteDoc(doc(firestore, 'photos', photo.id));
      toast({ title: t('photos.deleted') });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntDelete') });
    } finally {
      setDeletingPhotoId(null);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            aria-label={t('photos.add')}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {!photos || photos.length === 0 ? (
          <EmptyState message={t('photos.empty')} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {photos.map((photo) => (
              <CachedPhoto
                key={photo.id}
                url={photo.downloadUrl}
                alt={photo.caption || photo.uploadedByName}
                filename={`${photo.caption || photo.id}.jpg`}
                canDelete={photo.uploadedBy === user?.uid}
                onDelete={() => void handleDelete(photo)}
                isDeleting={deletingPhotoId === photo.id}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!captionDialog}
        onOpenChange={(open) => {
          if (!open) setCaptionDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('photos.addCaptionTitle')}</DialogTitle>
          </DialogHeader>
          <Input
            value={captionDialog?.caption ?? ''}
            onChange={(e) =>
              setCaptionDialog((current) =>
                current ? { ...current, caption: e.target.value } : current
              )
            }
            placeholder={t('photos.captionPlaceholder')}
            autoFocus
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setCaptionDialog(null)}>
              {t('photos.skipCaption')}
            </Button>
            <Button onClick={() => void saveCaption()} disabled={isSavingCaption}>
              {isSavingCaption ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
