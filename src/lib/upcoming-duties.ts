import { startOfDay } from 'date-fns';
import { toCalendarDate } from '@/lib/dates';
import { normalizeName } from '@/lib/name-similarity';
import {
  SCHEDULE_ROLE_KEYS,
  getScheduleRoleValue,
  type ScheduleRoleKey,
} from '@/lib/schedule-roles';
import type { Schedule, UserProfile, Volunteer } from '@/lib/types';

export type UpcomingDuty = {
  scheduleId: string;
  date: Date;
  roles: ScheduleRoleKey[];
};

function getRosterNameSet(
  profile: UserProfile | null | undefined,
  volunteer: Volunteer | null | undefined
) {
  const names = new Set<string>();
  const displayName = profile?.displayName?.trim();
  const volunteerName = volunteer?.name?.trim();

  if (displayName) names.add(normalizeName(displayName));
  if (volunteerName) names.add(normalizeName(volunteerName));

  return names;
}

export function getRolesForSchedule(
  schedule: Schedule,
  rosterNames: Set<string>
): ScheduleRoleKey[] {
  return SCHEDULE_ROLE_KEYS.filter((role) => {
    const assigned = getScheduleRoleValue(schedule, role);
    return assigned && rosterNames.has(normalizeName(assigned));
  });
}

export function getUpcomingDuties(
  schedules: Schedule[] | null | undefined,
  profile: UserProfile | null | undefined,
  volunteer: Volunteer | null | undefined,
  from = new Date()
): UpcomingDuty[] {
  if (!schedules?.length || !profile) return [];

  const rosterNames = getRosterNameSet(profile, volunteer);
  if (rosterNames.size === 0) return [];

  const today = startOfDay(from);
  const duties: UpcomingDuty[] = [];

  for (const schedule of schedules) {
    const scheduleDate = toCalendarDate(schedule.date);
    if (!scheduleDate || scheduleDate < today) continue;

    const roles = getRolesForSchedule(schedule, rosterNames);
    if (roles.length === 0) continue;

    duties.push({
      scheduleId: schedule.id,
      date: scheduleDate,
      roles,
    });
  }

  return duties.sort((a, b) => a.date.getTime() - b.date.getTime());
}
