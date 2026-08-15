import { addDays, format, startOfDay } from 'date-fns';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { SCHEDULE_ROLE_KEYS, type ScheduleRoleKey } from '@/lib/schedule-roles';
import { getAdminFirestore, getAdminMessaging } from '@/lib/firebase-admin';

const ROLE_LABELS: Record<ScheduleRoleKey, string> = {
  worship: 'Worship',
  offering: 'Offering',
  sermon: 'Sermon',
  chant: 'Chant',
  activity: 'Activity',
};

type VolunteerRecord = {
  name: string;
  userId?: string;
};

export type RosterReminderResult = {
  targetDate: string;
  schedulesChecked: number;
  remindersSent: number;
  skippedNoUser: number;
  skippedNoTokens: number;
  skippedAlreadySent: number;
};

export async function sendRosterReminders(): Promise<RosterReminderResult> {
  const db = getAdminFirestore();
  const messaging = getAdminMessaging();
  const targetDate = startOfDay(addDays(new Date(), 7));
  const nextDay = startOfDay(addDays(targetDate, 1));

  const schedulesSnap = await db
    .collection('ndcpcSchedules')
    .where('date', '>=', Timestamp.fromDate(targetDate))
    .where('date', '<', Timestamp.fromDate(nextDay))
    .get();

  const volunteersSnap = await db.collection('ndcpcVolunteers').get();
  const volunteersByName = new Map<string, VolunteerRecord>();

  for (const doc of volunteersSnap.docs) {
    const data = doc.data() as VolunteerRecord;
    if (data.name) {
      volunteersByName.set(data.name.trim(), data);
    }
  }

  const result: RosterReminderResult = {
    targetDate: format(targetDate, 'yyyy-MM-dd'),
    schedulesChecked: schedulesSnap.size,
    remindersSent: 0,
    skippedNoUser: 0,
    skippedNoTokens: 0,
    skippedAlreadySent: 0,
  };

  const dateLabel = format(targetDate, 'MMMM d, yyyy');

  for (const scheduleDoc of schedulesSnap.docs) {
    const schedule = scheduleDoc.data();

    for (const role of SCHEDULE_ROLE_KEYS) {
      const volunteerName = (schedule[role] as string | undefined)?.trim();
      if (!volunteerName) continue;

      const volunteer = volunteersByName.get(volunteerName);
      if (!volunteer?.userId) {
        result.skippedNoUser += 1;
        continue;
      }

      const reminderId = `${scheduleDoc.id}_${volunteer.userId}_${role}`;
      const existing = await db.collection('ndcpcRosterReminders').doc(reminderId).get();
      if (existing.exists) {
        result.skippedAlreadySent += 1;
        continue;
      }

      const userSnap = await db.collection('users').doc(volunteer.userId).get();
      const userData = userSnap.data();
      const approved = Boolean(userData?.isApproved ?? userData?.approved);
      if (!userSnap.exists || !approved) {
        result.skippedNoUser += 1;
        continue;
      }

      const tokens = [...new Set((userData?.fcmTokens as string[] | undefined) ?? [])].filter(Boolean);

      if (tokens.length === 0) {
        result.skippedNoTokens += 1;
        continue;
      }

      const body = `You're on the roster for ${dateLabel} (${ROLE_LABELS[role]}).`;

      for (let index = 0; index < tokens.length; index += 500) {
        const chunk = tokens.slice(index, index + 500);
        await messaging.sendEachForMulticast({
          tokens: chunk,
          notification: {
            title: 'Upcoming roster · NDC Preschool Church',
            body,
          },
          data: {
            url: '/roster',
          },
          webpush: {
            fcmOptions: {
              link: '/roster',
            },
          },
        });
      }

      await db.collection('ndcpcRosterReminders').doc(reminderId).set({
        scheduleId: scheduleDoc.id,
        userId: volunteer.userId,
        volunteerName,
        role,
        serviceDate: schedule.date,
        sentAt: FieldValue.serverTimestamp(),
      });

      result.remindersSent += 1;
    }
  }

  return result;
}
