'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { useTranslation } from '@/context/LocaleProvider';
import { isSupportedVideoUrl } from '@/lib/video';

interface AddResourceFormProps {
  initialCategory: 'songs' | 'chants';
  onSuccess?: () => void;
}

export function AddResourceForm({ initialCategory, onSuccess }: AddResourceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const formSchema = z.object({
    url: z.string().url(t('resources.invalidLink')).refine(
      (url) => isSupportedVideoUrl(url),
      t('resources.supportedVideoOnly')
    ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });

  useEffect(() => {
    form.reset({ url: '' });
  }, [initialCategory, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({ variant: 'destructive', title: t('common.offline') });
      return;
    }
    setIsSubmitting(true);

    try {
      const metadataResponse = await fetch(
        `/api/video-metadata?url=${encodeURIComponent(values.url)}`
      );
      if (!metadataResponse.ok) {
        throw new Error('Could not fetch video details from URL.');
      }
      const data = await metadataResponse.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const resourcesCollectionRef = collection(firestore, 'resources');

      const newResource = {
        title: data.title || t('resources.untitledVideo'),
        url: data.url || values.url,
        category: initialCategory,
        createdAt: serverTimestamp(),
      };

      await addDoc(resourcesCollectionRef, newResource);

      toast({ title: t('common.added') });

      form.reset({ url: '' });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('toast.couldntAdd'),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('resources.videoLink')}</FormLabel>
              <FormControl>
                <Input placeholder={t('resources.videoPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.adding') : t('common.add')}
        </Button>
      </form>
    </Form>
  );
}
