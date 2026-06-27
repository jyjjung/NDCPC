import { addWeeks, isSunday, nextSunday, startOfDay, subWeeks } from 'date-fns';

export function getSundays() {
  const sundays = [];
  const currentSunday = nextSunday(new Date());

  for (let i = 10; i > 0; i--) {
    sundays.push(subWeeks(currentSunday, i));
  }

  for (let i = 0; i < 20; i++) {
    sundays.push(addWeeks(currentSunday, i));
  }

  return sundays;
}

export function getDefaultSunday() {
  return nextSunday(new Date());
}

export function getUpcomingSunday(from = new Date()) {
  const today = startOfDay(from);
  if (isSunday(today)) return today;
  return startOfDay(nextSunday(today));
}

export function toCalendarDate(timestamp?: { seconds: number }) {
  if (!timestamp?.seconds) return null;
  return startOfDay(new Date(timestamp.seconds * 1000));
}

export function isSameCalendarDay(
  timestamp: { seconds: number } | undefined,
  date: Date
) {
  const itemDate = toCalendarDate(timestamp);
  if (!itemDate) return false;
  return itemDate.getTime() === startOfDay(date).getTime();
}

export function findBySunday<T extends { date?: { seconds: number } }>(
  items: T[] | null | undefined,
  sunday: Date
): T | undefined {
  if (!items) return undefined;
  return items.find((item) => isSameCalendarDay(item.date, sunday));
}
