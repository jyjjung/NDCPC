import { format } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import type { Locale } from '@/i18n/translations';

export function getDateFnsLocale(locale: Locale) {
  return locale === 'ko' ? ko : enUS;
}

export function formatAppDate(
  date: Date,
  pattern: string,
  locale: Locale
): string {
  const formatted = format(date, pattern, { locale: getDateFnsLocale(locale) });
  if (locale === 'ko') {
    return formatted.replace(/일요일/g, '주일');
  }
  return formatted;
}
