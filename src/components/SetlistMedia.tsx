'use client';

import { Resource } from '@/lib/types';
import { getYouTubeVideoId } from '@/lib/youtube';
import { useTranslation } from '@/context/LocaleProvider';

type SetlistMediaProps = {
  songs: Resource[];
  chants: Resource[];
};

function VideoList({ resources, startIndex = 1 }: { resources: Resource[]; startIndex?: number }) {
  if (resources.length === 0) return null;

  return (
    <ol className="space-y-6">
      {resources.map((resource, index) => {
        const videoId = getYouTubeVideoId(resource.url);

        return (
          <li key={resource.id} className="space-y-2">
            <p
              className="break-words text-sm font-medium [overflow-wrap:anywhere]"
              title={resource.title}
            >
              {startIndex + index}. {resource.title}
            </p>
            <div className="aspect-video overflow-hidden rounded-md bg-muted/30">
              {videoId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={resource.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={resource.url}
                  className="h-full w-full"
                  title={resource.title}
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function SetlistMedia({ songs, chants }: SetlistMediaProps) {
  const { t } = useTranslation();

  if (songs.length === 0 && chants.length === 0) return null;

  return (
    <div className="space-y-8">
      {songs.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('resources.songs')}
          </h3>
          <VideoList resources={songs} />
        </section>
      )}
      {chants.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('resources.chants')}
          </h3>
          <VideoList resources={chants} startIndex={1} />
        </section>
      )}
    </div>
  );
}
