'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ContentFlow, FlowItem } from './ContentFlow';
import { useTranslation } from '@/context/LocaleProvider';
import { isBootstrapAdminEmail, setUserRole } from '@/lib/users';
import { useToast } from '@/hooks/use-toast';

export function AdminRoleManager() {
  const firestore = useFirestore();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const approvedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('approved', '==', true));
  }, [firestore]);

  const { data: approvedUsers, isLoading } = useCollection<UserProfile>(approvedQuery);

  if (!profile || !isBootstrapAdminEmail(profile.email)) {
    return null;
  }

  const handleRoleChange = async (member: UserProfile, role: 'admin' | 'member') => {
    if (!firestore) return;
    if (isBootstrapAdminEmail(member.email)) return;

    setUpdatingUid(member.uid);
    try {
      await setUserRole(firestore, member.uid, role);
      toast({
        title: role === 'admin' ? t('adminPortal.madeAdmin') : t('adminPortal.removedAdmin'),
      });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('toast.couldntSave') });
    } finally {
      setUpdatingUid(null);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-headline text-lg font-semibold">{t('adminPortal.membersTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('adminPortal.membersHint')}</p>
      </div>
      {!approvedUsers || approvedUsers.length === 0 ? (
        <EmptyState message={t('adminPortal.noMembers')} />
      ) : (
        <ContentFlow>
          {[...(approvedUsers ?? [])]
            .sort((a, b) => a.displayName.localeCompare(b.displayName))
            .map((member) => {
            const isSuperAdmin = isBootstrapAdminEmail(member.email);
            const isMemberAdmin = member.role === 'admin';

            return (
              <FlowItem key={member.uid}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{member.displayName}</p>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  {isSuperAdmin ? (
                    <span className="shrink-0 text-xs font-medium text-primary">
                      {t('adminPortal.superAdmin')}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant={isMemberAdmin ? 'outline' : 'default'}
                      disabled={updatingUid === member.uid}
                      onClick={() =>
                        void handleRoleChange(member, isMemberAdmin ? 'member' : 'admin')
                      }
                    >
                      {isMemberAdmin ? t('adminPortal.removeAdmin') : t('adminPortal.makeAdmin')}
                    </Button>
                  )}
                </div>
              </FlowItem>
            );
          })}
        </ContentFlow>
      )}
    </section>
  );
}
