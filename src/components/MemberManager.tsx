'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { UserProfile, Volunteer } from '@/lib/types';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  getLinkedVolunteer,
  getUnlinkedVolunteers,
  linkUserToVolunteer,
  unlinkUserFromVolunteer,
  updateMemberDisplayName,
} from '@/lib/users';
import { useToast } from '@/hooks/use-toast';
import { DATA_CACHE_KEYS } from '@/lib/data-cache';

export function MemberManager() {
  const firestore = useFirestore();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [editingMember, setEditingMember] = useState<UserProfile | null>(null);
  const [linkingMember, setLinkingMember] = useState<UserProfile | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const approvedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('approved', '==', true));
  }, [firestore]);

  const volunteersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'volunteers'), orderBy('name'));
  }, [firestore]);

  const { data: approvedUsers, isLoading: usersLoading } =
    useCollection<UserProfile>(approvedQuery);
  const { data: volunteers, isLoading: volunteersLoading } = useCollection<Volunteer>(
    volunteersQuery,
    { cacheKey: DATA_CACHE_KEYS.volunteers }
  );

  const unlinkedVolunteers = getUnlinkedVolunteers(volunteers ?? []);

  const openEditDialog = (member: UserProfile) => {
    setEditingMember(member);
    setNameDraft(member.displayName);
  };

  const openLinkDialog = (member: UserProfile) => {
    setLinkingMember(member);
    setSelectedVolunteerId('');
  };

  const handleSaveName = async () => {
    if (!firestore || !editingMember) return;

    setIsSubmitting(true);
    try {
      await updateMemberDisplayName(
        firestore,
        editingMember.uid,
        nameDraft,
        volunteers ?? []
      );
      toast({ title: t('adminPortal.nameUpdated') });
      setEditingMember(null);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLink = async () => {
    if (!firestore || !linkingMember || !selectedVolunteerId) return;

    const volunteer = volunteers?.find((entry) => entry.id === selectedVolunteerId);
    if (!volunteer) return;

    setIsSubmitting(true);
    try {
      await linkUserToVolunteer(firestore, linkingMember, volunteer, volunteers ?? []);
      toast({ title: t('adminPortal.linked') });
      setLinkingMember(null);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async (member: UserProfile) => {
    if (!firestore) return;

    const linkedVolunteer = getLinkedVolunteer(member, volunteers ?? []);
    if (!linkedVolunteer) return;

    setIsSubmitting(true);
    try {
      await unlinkUserFromVolunteer(firestore, linkedVolunteer);
      toast({ title: t('adminPortal.unlinked') });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (usersLoading || volunteersLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <section className="space-y-4">
        <div>
          <h2 className="font-headline text-lg font-semibold">{t('adminPortal.manageTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('adminPortal.manageHint')}</p>
        </div>
        {!approvedUsers || approvedUsers.length === 0 ? (
          <EmptyState message={t('adminPortal.noMembers')} />
        ) : (
          <ContentFlow>
            {[...(approvedUsers ?? [])]
              .sort((a, b) => a.displayName.localeCompare(b.displayName))
              .map((member) => {
                const linkedVolunteer = getLinkedVolunteer(member, volunteers ?? []);

                return (
                  <FlowItem key={member.uid}>
                    <div className="space-y-3">
                      <div className="min-w-0">
                        <p className="font-medium">{member.displayName}</p>
                        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {linkedVolunteer
                            ? t('adminPortal.linkedTo', { name: linkedVolunteer.name })
                            : t('adminPortal.notLinked')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSubmitting}
                          onClick={() => openEditDialog(member)}
                        >
                          {t('adminPortal.editName')}
                        </Button>
                        {linkedVolunteer ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => void handleUnlink(member)}
                          >
                            {t('adminPortal.unlinkRoster')}
                          </Button>
                        ) : unlinkedVolunteers.length > 0 ? (
                          <Button
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => openLinkDialog(member)}
                          >
                            {t('adminPortal.linkRoster')}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </FlowItem>
                );
              })}
          </ContentFlow>
        )}
      </section>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminPortal.editNameTitle')}</DialogTitle>
            <DialogDescription>{t('adminPortal.editNameHint')}</DialogDescription>
          </DialogHeader>
          <Input
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder={t('auth.displayName')}
            autoComplete="off"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={isSubmitting || nameDraft.trim().length < 2}
              onClick={() => void handleSaveName()}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkingMember} onOpenChange={(open) => !open && setLinkingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminPortal.linkRosterTitle')}</DialogTitle>
            <DialogDescription>
              {t('adminPortal.linkRosterHint', { name: linkingMember?.displayName ?? '' })}
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
            <Button variant="outline" onClick={() => setLinkingMember(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={isSubmitting || !selectedVolunteerId}
              onClick={() => void handleLink()}
            >
              {t('adminPortal.linkRoster')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
