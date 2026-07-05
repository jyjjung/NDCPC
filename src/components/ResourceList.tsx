'use client';

import * as React from 'react';
import { Resource } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LocaleProvider';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { DATA_CACHE_KEYS } from '@/lib/data-cache';
import { VideoEmbed } from '@/components/VideoEmbed';

interface ResourceListProps {
  category: 'songs' | 'chants';
  isManageMode: boolean;
  selectedResources: string[];
  onSelectionChange: (resourceId: string, isSelected: boolean) => void;
}

export function ResourceList({
  category,
  isManageMode,
  selectedResources,
  onSelectionChange,
}: ResourceListProps) {
  const firestore = useFirestore();
  const { t } = useTranslation();

  const resourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'resources'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allResources, isLoading } = useCollection<Resource>(resourcesQuery, {
    cacheKey: DATA_CACHE_KEYS.resources,
  });

  const resources = React.useMemo(() => {
    if (!allResources) return [];
    return allResources.filter((resource) => resource.category === category);
  }, [allResources, category]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!resources || resources.length === 0) {
    return (
      <EmptyState
        message={category === 'songs' ? t('resources.noSongs') : t('resources.noChants')}
      />
    );
  }

  const content = resources.map((resource) => {
    const isSelected = selectedResources.includes(resource.id);

    const trigger = (
      <div className="flex w-full items-center gap-3">
        {isManageMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange(resource.id, !!checked)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t('resources.selectItem', { title: resource.title })}
          />
        )}
        <span
          className="min-w-0 flex-1 break-words text-left [overflow-wrap:anywhere] line-clamp-2"
          title={resource.title}
        >
          {resource.title}
        </span>
      </div>
    );

    if (isManageMode) {
      return (
        <div
          key={resource.id}
          className={cn(
            'flex cursor-pointer items-center border-b border-border/40 py-4 transition-colors last:border-0',
            isSelected && 'bg-accent/50 -mx-2 px-2'
          )}
          onClick={() => onSelectionChange(resource.id, !isSelected)}
        >
          {trigger}
        </div>
      );
    }

    return (
      <AccordionItem value={resource.id} key={resource.id} className="border-b border-border/40 last:border-0">
        <AccordionTrigger className="py-4 text-[0.9375rem] no-underline hover:no-underline">
          {trigger}
        </AccordionTrigger>
        <AccordionContent className="pb-5 pt-0">
          <VideoEmbed
            url={resource.url}
            title={resource.title}
            startSeconds={resource.startSeconds}
            endSeconds={resource.endSeconds}
          />
        </AccordionContent>
      </AccordionItem>
    );
  });

  if (isManageMode) {
    return <div>{content}</div>;
  }

  return (
    <Accordion type="single" collapsible>
      {content}
    </Accordion>
  );
}
