'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Resource, Schedule, Setlist } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { findBySunday, getUpcomingSunday } from '@/lib/dates';
import { normalizeSetlist, resolveSetlistResources } from '@/lib/setlist';
import { resolveServiceSteps } from '@/lib/worship-format';
import { useTranslation } from '@/context/LocaleProvider';
import { formatAppDate } from '@/lib/format-date';
import { LoadingState } from './LoadingState';
import { CombinedServiceView } from './CombinedServiceView';
import { SetlistMedia } from './SetlistMedia';
import { UpcomingDuties } from './UpcomingDuties';
import { useWeeklyWorshipFormat } from './WorshipFormatManager';
import { Button } from './ui/button';

export function DashboardView() {
  const firestore = useFirestore();
  const { t, locale } = useTranslation();
  const upcomingSunday = useMemo(() => getUpcomingSunday(), []);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('date', 'desc'));
  }, [firestore]);

  const setlistsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'setlists'), orderBy('date', 'desc'));
  }, [firestore]);

  const resourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'resources'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: schedules, isLoading: schedulesLoading } =
    useCollection<Schedule>(schedulesQuery);
  const { data: setlists, isLoading: setlistsLoading } =
    useCollection<Setlist>(setlistsQuery);
  const { data: weeklyFormat, isLoading: worshipFormatLoading } = useWeeklyWorshipFormat();
  const { data: resources } = useCollection<Resource>(resourcesQuery);

  const isLoading = schedulesLoading || setlistsLoading || worshipFormatLoading;

  const upcomingSchedule = findBySunday(schedules, upcomingSunday);
  const upcomingSetlist = findBySunday(setlists, upcomingSunday);
  const serviceSteps = resolveServiceSteps(weeklyFormat?.items);

  const resourceMap = useMemo(
    () => new Map(resources?.map((r) => [r.id, r]) ?? []),
    [resources]
  );

  const normalizedSetlist = upcomingSetlist
    ? normalizeSetlist(upcomingSetlist, resourceMap)
    : { songIds: [], chantIds: [] };

  const setlistSongs = resolveSetlistResources(normalizedSetlist.songIds, resourceMap);
  const setlistChants = resolveSetlistResources(normalizedSetlist.chantIds, resourceMap);

  const dateLabel = formatAppDate(upcomingSunday, 'EEEE, MMMM d', locale);
  const hasSetlist = setlistSongs.length > 0 || setlistChants.length > 0;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <div className="space-y-10">
        <UpcomingDuties schedules={schedules} />

        <section>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('dashboard.upcoming')}
          </p>
          <p className="font-headline text-2xl font-semibold leading-snug sm:text-3xl">
            {dateLabel}
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-headline text-lg font-semibold">{t('dashboard.service')}</h2>
            <Button asChild variant="ghost" size="sm" className="h-8 shrink-0">
              <Link href="/schedule">{t('dashboard.viewAll')}</Link>
            </Button>
          </div>
          <CombinedServiceView items={serviceSteps} schedule={upcomingSchedule} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-headline text-lg font-semibold">{t('dashboard.setlist')}</h2>
            <Button asChild variant="ghost" size="sm" className="h-8 shrink-0">
              <Link href="/setlist">{t('dashboard.viewAll')}</Link>
            </Button>
          </div>
          {hasSetlist ? (
            <SetlistMedia songs={setlistSongs} chants={setlistChants} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('dashboard.noSetlist')}</p>
          )}
        </section>
      </div>
    </>
  );
}
