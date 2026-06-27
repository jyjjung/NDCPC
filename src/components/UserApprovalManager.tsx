'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { UserProfile, Volunteer } from '@/lib/types';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ContentFlow, FlowItem } from './ContentFlow';
import { useTranslation } from '@/context/LocaleProvider';
import {
  approveAndLinkUser,
  approveUser,
  findSimilarVolunteers,
  getUnlinkedVolunteers,
} from '@/lib/users';
import { useToast } from '@/hooks/use-toast';
import { DuplicateNameDialog } from './DuplicateNameDialog';
import type { VolunteerLinkOption } from '@/lib/users';

export function UserApprovalManager() {
  const firestore = useFirestore();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const [similarVolunteers, setSimilarVolunteers] = useState<Volunteer[]>([]);
  const [linkingProfile, setLinkingProfile] = useState<UserProfile | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('approved', '==', false));
  }, [firestore]);

  const volunteersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'volunteers'), orderBy('name'));
  }, [firestore]);

  const { data: pendingUsers, isLoading: pendingLoading } =
    useCollection<UserProfile>(pendingQuery);
  const { data: volunteers, isLoading: volunteersLoading } =
    useCollection<Volunteer>(volunteersQuery);

  const unlinkedVolunteers = getUnlinkedVolunteers(volunteers ?? []);

  const handleApproveClick = (profile: UserProfile) => {
    const matches = findSimilarVolunteers(profile.displayName, volunteers ?? []);
    if (matches.length > 0) {
      setPendingProfile(profile);
      setSimilarVolunteers(matches);
      return;
    }
    void completeApproval(profile, 'keep_both');
  };

  const completeApproval = async (
    profile: UserProfile,
    option: VolunteerLinkOption,
    existingVolunteer?: Volunteer
  ) => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      await approveUser(firestore, profile, volunteers ?? [], option);
      toast({ title: t('adminPortal.approved') });
      setPendingProfile(null);
      setSimilarVolunteers([]);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkAndApprove = async () => {
    if (!firestore || !linkingProfile || !selectedVolunteerId) return;

    const volunteer = volunteers?.find((entry) => entry.id === selectedVolunteerId);
    if (!volunteer) return;

    setIsSubmitting(true);
    try {
      await approveAndLinkUser(firestore, linkingProfile, volunteer, volunteers ?? []);
      toast({ title: t('adminPortal.approved') });
      setLinkingProfile(null);
      setSelectedVolunteerId('');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingLoading || volunteersLoading) {
    return <LoadingState />;
  }

  return (
    <>
      {!pendingUsers || pendingUsers.length === 0 ? (
        <EmptyState message={t('adminPortal.noPending')} />
      ) : (
        <ContentFlow>
          {pendingUsers.map((profile) => (
            <FlowItem key={profile.uid}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{profile.displayName}</p>
                  <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unlinkedVolunteers.length > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => {
                        setLinkingProfile(profile);
                        setSelectedVolunteerId('');
                      }}
                    >
                      {t('adminPortal.linkAndApprove')}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleApproveClick(profile)}
                  >
                    {t('adminPortal.approve')}
                  </Button>
                </div>
              </div>
            </FlowItem>
          ))}
        </ContentFlow>
      )}

      <DuplicateNameDialog
        open={!!pendingProfile}
        profile={pendingProfile}
        similarVolunteers={similarVolunteers}
        onClose={() => {
          setPendingProfile(null);
          setSimilarVolunteers([]);
        }}
        onConfirm={(option) => {
          if (!pendingProfile) return;
          void completeApproval(pendingProfile, option, similarVolunteers[0]);
        }}
      />

      <Dialog open={!!linkingProfile} onOpenChange={(open) => !open && setLinkingProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminPortal.linkAndApproveTitle')}</DialogTitle>
            <DialogDescription>
              {t('adminPortal.linkAndApproveHint', { name: linkingProfile?.displayName ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
            <SelectTrigger>
              <SelectValue placeholder={t('adminPortal.selectRosterMember')} />
            </SelectTrigger>
            <SelectContent>
              {unlinkedVolunteers.map((volunteer) => (
                <SelectItem key={volunteer.id} value={volunteer.id}>
                  {volunteer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingProfile(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={isSubmitting || !selectedVolunteerId}
              onClick={() => void handleLinkAndApprove()}
            >
              {t('adminPortal.linkAndApprove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
