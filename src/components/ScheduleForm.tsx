
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
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { addWeeks, format, nextSunday, subWeeks } from 'date-fns';

const formSchema = z.object({
  date: z.string({
    required_error: 'A date is required.',
  }),
  worship: z.string().min(1, 'Worship leader name is required.'),
  offering: z.string().min(1, 'Offering person name is required.'),
  sermonChant: z.string().min(1, 'Sermon chant leader is required.'),
  activity: z.string().min(1, 'Activity leader is required.'),
});

type ScheduleFormValues = z.infer<typeof formSchema>;

interface ScheduleFormProps {
  onSuccess: () => void;
  schedule?: Schedule | null;
}

// Helper to generate a list of Sundays
const getSundays = () => {
    const sundays = [];
    const today = new Date();
    let currentSunday = nextSunday(today);
    
    // Add 10 past Sundays
    for (let i = 10; i > 0; i--) {
        sundays.push(subWeeks(currentSunday, i));
    }

    // Add current/next and 20 future Sundays
    for (let i = 0; i < 20; i++) {
        sundays.push(addWeeks(currentSunday, i));
    }
    return sundays;
}

export function ScheduleForm({ onSuccess, schedule }: ScheduleFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const sundays = getSundays();
  const defaultSunday = nextSunday(new Date());


  const volunteersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'volunteers'), orderBy('name'));
  }, [firestore]);

  const { data: volunteers } = useCollection<Volunteer>(volunteersQuery);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: defaultSunday.toISOString(),
      worship: '',
      offering: '',
      sermonChant: '',
      activity: '',
    },
  });
  
  useEffect(() => {
    if (schedule) {
      form.reset({
        ...schedule,
        date: schedule.date?.seconds ? new Date(schedule.date.seconds * 1000).toISOString() : defaultSunday.toISOString(),
      });
    } else {
        form.reset({
            date: defaultSunday.toISOString(),
            worship: '',
            offering: '',
            sermonChant: '',
            activity: '',
        })
    }
  }, [schedule, form, defaultSunday]);


  const onSubmit = async (values: ScheduleFormValues) => {
    if (!firestore) return;

    try {
        const scheduleData = {
            ...values,
            date: Timestamp.fromDate(new Date(values.date)),
        };

        if (schedule?.id) {
            // Update existing document
            const scheduleRef = doc(firestore, 'schedules', schedule.id);
            await setDoc(scheduleRef, scheduleData);
            toast({ title: 'Success', description: 'Schedule has been updated.' });
        } else {
            // Create new document
            await addDoc(collection(firestore, 'schedules'), scheduleData);
            toast({ title: 'Success', description: 'New schedule has been added.' });
        }
        onSuccess();
    } catch (error) {
        console.error('Error saving schedule: ', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not save the schedule.',
        });
    }
  };

  const renderSelectField = (name: keyof ScheduleFormValues, label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {volunteers?.map(v => (
                <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
                <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    defaultValue={defaultSunday.toISOString()}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a Sunday" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {sundays.map(sunday => (
                            <SelectItem key={sunday.toISOString()} value={sunday.toISOString()}>
                                {format(sunday, "PPP")}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {renderSelectField("worship", "Worship")}
        {renderSelectField("offering", "Offering")}
        {renderSelectField("sermonChant", "Sermon Chant")}
        {renderSelectField("activity", "Activity")}

        <Button type="submit" className="w-full">
            {form.formState.isSubmitting ? 'Saving...' : 'Save Schedule'}
        </Button>
      </form>
    </Form>
  );
}
