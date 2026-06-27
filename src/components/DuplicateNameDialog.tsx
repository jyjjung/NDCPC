'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/LocaleProvider';
import type { UserProfile, Volunteer } from '@/lib/types';
import type { VolunteerLinkOption } from '@/lib/users';

type DuplicateNameDialogProps = {
  open: boolean;
  profile: UserProfile | null;
  similarVolunteers: Volunteer[];
  onClose: () => void;
  onConfirm: (option: VolunteerLinkOption) => void;
};

export function DuplicateNameDialog({
  open,
  profile,
  similarVolunteers,
  onClose,
  onConfirm,
}: DuplicateNameDialogProps) {
  const { t } = useTranslation();
  const existing = similarVolunteers[0];

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('adminPortal.duplicateTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('adminPortal.duplicateDescription', {
              newName: profile?.displayName ?? '',
              existingName: existing?.name ?? '',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={() => onConfirm('merge')}>
            {t('adminPortal.mergeUsers')}
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => onConfirm('delete_old')}>
            {t('adminPortal.deleteOldUser')}
          </Button>
          <Button className="w-full" variant="outline" onClick={() => onConfirm('keep_both')}>
            {t('adminPortal.keepBoth')}
          </Button>
          <AlertDialogCancel className="w-full">{t('common.cancel')}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
