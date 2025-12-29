
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import type { Schedule } from '@/lib/types';
import { useEffect } from 'react';

const formSchema = z.object({
  date: z.date({
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

export function ScheduleForm({ onSuccess, schedule }: ScheduleFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: undefined,
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
        date: schedule.date?.seconds ? new Date(schedule.date.seconds * 1000) : new Date(),
      });
    } else {
        form.reset({
            date: undefined,
            worship: '',
            offering: '',
            sermonChant: '',
            activity: '',
        })
    }
  }, [schedule, form]);


  const onSubmit = async (values: ScheduleFormValues) => {
    if (!firestore) return;

    try {
        const scheduleData = {
            ...values,
            date: Timestamp.fromDate(values.date),
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="worship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Worship</FormLabel>
              <FormControl>
                <Input placeholder="Enter name..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="offering"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Offering</FormLabel>
              <FormControl>
                <Input placeholder="Enter name..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sermonChant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sermon Chant</FormLabel>
              <FormControl>
                <Input placeholder="Enter name..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="activity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity</FormLabel>
              <FormControl>
                <Input placeholder="Enter name..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
            {form.formState.isSubmitting ? 'Saving...' : 'Save Schedule'}
        </Button>
      </form>
    </Form>
  );
}
