'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { useTranslation } from '@/context/LocaleProvider';
import { getYouTubeVideoId, isAllowedVideoInputUrl } from '@/lib/video';
import {
  findChapterIndexForTimestamp,
  formatChapterTime,
  getYouTubeTimestampFromUrl,
  resolveYouTubeClip,
  YOUTUBE_FULL_VIDEO_VALUE,
  YOUTUBE_MARKER_VALUE,
  type YouTubeChapter,
} from '@/lib/youtube-chapters';

interface AddResourceFormProps {
  initialCategory: 'songs' | 'chants';
  onSuccess?: () => void;
}

type VideoPreview = {
  title: string;
  url: string;
  provider?: string;
  chapters?: YouTubeChapter[];
  timestamp?: number | null;
};

export function AddResourceForm({ initialCategory, onSuccess }: AddResourceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(YOUTUBE_FULL_VIDEO_VALUE);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const formSchema = z.object({
    url: z.string().url(t('resources.invalidLink')).refine(
      (url) => isAllowedVideoInputUrl(url),
      t('resources.supportedVideoOnly')
    ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });

  const watchedUrl = form.watch('url');

  useEffect(() => {
    form.reset({ url: '' });
    setPreview(null);
    setSelectedChapter(YOUTUBE_FULL_VIDEO_VALUE);
  }, [initialCategory, form]);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      if (!watchedUrl || !isAllowedVideoInputUrl(watchedUrl) || !getYouTubeVideoId(watchedUrl)) {
        setPreview(null);
        setSelectedChapter(YOUTUBE_FULL_VIDEO_VALUE);
        return;
      }

      setIsLoadingPreview(true);

      try {
        const metadataResponse = await fetch(
          `/api/video-metadata?url=${encodeURIComponent(watchedUrl)}`
        );
        const data = await metadataResponse.json();

        if (!metadataResponse.ok || data.error) {
          setPreview(null);
          setSelectedChapter(YOUTUBE_FULL_VIDEO_VALUE);
          return;
        }

        setPreview(data);

        if (typeof data.timestamp === 'number' && data.timestamp > 0) {
          if (data.chapters?.length) {
            const chapterIndex = findChapterIndexForTimestamp(data.chapters, data.timestamp);
            setSelectedChapter(
              chapterIndex >= 0 ? String(chapterIndex) : YOUTUBE_MARKER_VALUE
            );
          } else {
            setSelectedChapter(YOUTUBE_MARKER_VALUE);
          }
        } else {
          setSelectedChapter(YOUTUBE_FULL_VIDEO_VALUE);
        }
      } catch {
        setPreview(null);
        setSelectedChapter(YOUTUBE_FULL_VIDEO_VALUE);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [watchedUrl]);

  async function fetchVideoMetadata(url: string) {
    const metadataResponse = await fetch(`/api/video-metadata?url=${encodeURIComponent(url)}`);
    const data = await metadataResponse.json();

    if (!metadataResponse.ok || data.error) {
      throw new Error(data.error || 'Could not fetch video details from URL.');
    }

    return data as VideoPreview;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({ variant: 'destructive', title: t('common.offline') });
      return;
    }
    setIsSubmitting(true);

    try {
      const isYouTube = Boolean(getYouTubeVideoId(values.url));
      const metadata = isYouTube && preview?.url ? preview : await fetchVideoMetadata(values.url);

      let title = metadata.title || t('resources.untitledVideo');
      const url = metadata.url || values.url;
      let startSeconds: number | undefined;
      let endSeconds: number | undefined;

      if (isYouTube) {
        const timestamp =
          typeof metadata.timestamp === 'number'
            ? metadata.timestamp
            : getYouTubeTimestampFromUrl(values.url);

        const clip = resolveYouTubeClip({
          chapters: metadata.chapters,
          selectedChapter,
          timestamp,
        });

        if (clip.chapterTitle) {
          title = `${metadata.title} - ${clip.chapterTitle}`;
        }

        startSeconds = clip.startSeconds;
        endSeconds = clip.endSeconds;
      }

      const resourcesCollectionRef = collection(firestore, 'resources');

      const newResource = {
        title,
        url,
        category: initialCategory,
        createdAt: serverTimestamp(),
        ...(startSeconds !== undefined ? { startSeconds } : {}),
        ...(endSeconds !== undefined ? { endSeconds } : {}),
      };

      await addDoc(resourcesCollectionRef, newResource);

      toast({ title: t('common.added') });

      form.reset({ url: '' });
      setPreview(null);
      setSelectedChapter(YOUTUBE_FULL_VIDEO_VALUE);

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

  const hasChapters = Boolean(preview?.chapters?.length);
  const markerSeconds =
    typeof preview?.timestamp === 'number' && preview.timestamp > 0 ? preview.timestamp : null;
  // Timestamp-only links (no chapter list): show the preserved song marker.
  const showTimestampMarker = Boolean(markerSeconds && !hasChapters);

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

        {isLoadingPreview && (
          <p className="text-sm text-muted-foreground">{t('resources.loadingChapters')}</p>
        )}

        {hasChapters && preview?.title && (
          <div className="space-y-2">
            <FormLabel>{t('resources.youtubeChapter')}</FormLabel>
            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger>
                <SelectValue placeholder={t('resources.selectChapter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={YOUTUBE_FULL_VIDEO_VALUE}>{t('resources.fullVideo')}</SelectItem>
                {markerSeconds !== null && (
                  <SelectItem value={YOUTUBE_MARKER_VALUE}>
                    {formatChapterTime(markerSeconds)} - {t('resources.youtubeMarker')}
                  </SelectItem>
                )}
                {preview.chapters?.map((chapter, index) => (
                  <SelectItem key={`${chapter.startSeconds}-${chapter.title}`} value={String(index)}>
                    {formatChapterTime(chapter.startSeconds)} - {chapter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('resources.chapterHint', { title: preview.title })}
            </p>
          </div>
        )}

        {showTimestampMarker && markerSeconds !== null && (
          <div className="space-y-1">
            <FormLabel>{t('resources.youtubeMarker')}</FormLabel>
            <p className="text-sm">
              {t('resources.markerStartsAt', { time: formatChapterTime(markerSeconds) })}
            </p>
            {preview?.title && (
              <p className="text-sm text-muted-foreground">
                {t('resources.chapterHint', { title: preview.title })}
              </p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingPreview}>
          {isSubmitting ? t('common.adding') : t('common.add')}
        </Button>
      </form>
    </Form>
  );
}
