'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, setDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import type { Schedule, Volunteer } from '@/lib/types';
import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { getDefaultSunday, getSundays } from '@/lib/dates';
import { useTranslation } from '@/context/LocaleProvider';
import { formatAppDate } from '@/lib/format-date';
import { SCHEDULE_ROLE_KEYS } from '@/lib/schedule-roles';

const BLANK_VALUE = '__blank__';

interface ScheduleFormProps {
  onSuccess: () => void;
  schedule?: Schedule | null;
}

export function ScheduleForm({ onSuccess, schedule }: ScheduleFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t, locale } = useTranslation();

  const formSchema = z.object({
    date: z.string({
      required_error: t('schedules.dateRequired'),
    }),
    worship: z.string(),
    offering: z.string(),
    sermon: z.string(),
    chant: z.string(),
    activity: z.string(),
  });

  type ScheduleFormValues = z.infer<typeof formSchema>;

  const sundays = useMemo(() => getSundays(), []);
  const defaultSunday = useMemo(() => getDefaultSunday(), []);

  const volunteersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ndcpcVolunteers'), orderBy('name'));
  }, [firestore]);

  const { data: volunteers } = useCollection<Volunteer>(volunteersQuery);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: schedule
      ? {
          ...schedule,
          date: schedule.date?.seconds
            ? new Date(schedule.date.seconds * 1000).toISOString()
            : defaultSunday.toISOString(),
        }
      : {
          date: defaultSunday.toISOString(),
          worship: '',
          offering: '',
          sermon: '',
          chant: '',
          activity: '',
        },
  });

  const onSubmit = async (values: ScheduleFormValues) => {
    if (!firestore) return;

    try {
      const scheduleData = {
        worship: values.worship.trim(),
        offering: values.offering.trim(),
        sermon: values.sermon.trim(),
        chant: values.chant.trim(),
        activity: values.activity.trim(),
        date: Timestamp.fromDate(new Date(values.date)),
      };

      if (schedule?.id) {
        const scheduleRef = doc(firestore, 'ndcpcSchedules', schedule.id);
        await setDoc(scheduleRef, scheduleData);
        toast({ title: t('common.saved') });
      } else {
        await addDoc(collection(firestore, 'ndcpcSchedules'), scheduleData);
        toast({ title: t('common.added') });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving schedule: ', error);
      toast({
        variant: 'destructive',
        title: t('toast.couldntSave'),
      });
    }
  };

  return (
    <ScrollArea className="max-h-[70vh] p-1">
      <div className="pr-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.date')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('schedules.selectSunday')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sundays.map((sunday) => (
                        <SelectItem key={sunday.toISOString()} value={sunday.toISOString()}>
                          {formatAppDate(sunday, 'PPP', locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {SCHEDULE_ROLE_KEYS.map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={key}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`schedules.role.${key}`)}</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === BLANK_VALUE ? '' : value)
                      }
                      value={field.value || BLANK_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('schedules.selectPerson')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={BLANK_VALUE}>{t('schedules.none')}</SelectItem>
                        {volunteers?.map((v) => (
                          <SelectItem key={v.id} value={v.name}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="submit" className="w-full">
              {form.formState.isSubmitting ? t('common.saving') : t('schedules.saveSchedule')}
            </Button>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}
