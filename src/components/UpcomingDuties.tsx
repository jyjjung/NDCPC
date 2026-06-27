'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Schedule, Volunteer } from '@/lib/types';
import { collection, orderBy, query } from 'firebase/firestore';
import { useTranslation } from '@/context/LocaleProvider';
import { formatAppDate } from '@/lib/format-date';
import { getUpcomingDuties } from '@/lib/upcoming-duties';
import { getLinkedVolunteer } from '@/lib/users';
import { DATA_CACHE_KEYS } from '@/lib/data-cache';
import type { ScheduleRoleKey } from '@/lib/schedule-roles';
import { ContentFlow, FlowItem } from './ContentFlow';

type UpcomingDutiesProps = {
  schedules: Schedule[] | null | undefined;
};

export function UpcomingDuties({ schedules }: UpcomingDutiesProps) {
  const { profile } = useAuth();
  const firestore = useFirestore();
  const { t, locale } = useTranslation();

  const volunteersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'volunteers'), orderBy('name'));
  }, [firestore]);

  const { data: volunteers } = useCollection<Volunteer>(volunteersQuery, {
    cacheKey: DATA_CACHE_KEYS.volunteers,
  });

  const linkedVolunteer = profile ? getLinkedVolunteer(profile, volunteers ?? []) : undefined;

  const duties = useMemo(
    () => getUpcomingDuties(schedules, profile, linkedVolunteer),
    [schedules, profile, linkedVolunteer]
  );

  const formatRoles = (roles: ScheduleRoleKey[]) =>
    roles.map((role) => t(`schedules.role.${role}`)).join(', ');

  if (!profile) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-headline text-lg font-semibold">{t('dashboard.yourDuties')}</h2>
      {duties.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('dashboard.noDuties')}</p>
      ) : (
        <ContentFlow>
          {duties.map((duty) => (
            <FlowItem key={duty.scheduleId}>
              <p className="font-medium">
                {formatAppDate(duty.date, 'EEEE, MMMM d', locale)}
              </p>
              <p className="text-sm text-muted-foreground">{formatRoles(duty.roles)}</p>
            </FlowItem>
          ))}
        </ContentFlow>
      )}
    </section>
  );
}
