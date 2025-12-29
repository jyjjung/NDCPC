
"use client";

import * as React from "react";
import { Resource, ResourceCategory } from "@/lib/types";
import { LoaderCircle } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";


interface ResourceListProps {
  category: ResourceCategory;
  isManageMode: boolean;
  selectedResources: string[];
  onSelectionChange: (resourceId: string, isSelected: boolean) => void;
}

const categoryLabels: Record<ResourceCategory, string> = {
  chants: "chants",
  songs: "songs",
  schedules: "schedules",
  announcements: "announcements",
  videos: "videos",
};

function getYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}


export function ResourceList({ category, isManageMode, selectedResources, onSelectionChange }: ResourceListProps) {
  const firestore = useFirestore();

  const resourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'resources'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: allResources, isLoading } = useCollection<Resource>(resourcesQuery);

  const resources = React.useMemo(() => {
    if (!allResources) return [];
    return allResources.filter(resource => resource.category === category);
  }, [allResources, category]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading resources...</p>
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/40 p-12 text-center mt-4">
        <p className="text-muted-foreground">No {categoryLabels[category]} available at the moment.</p>
      </div>
    );
  }
  
  const content = resources.map((resource) => {
    const youtubeVideoId = getYouTubeVideoId(resource.url);
    const isSelected = selectedResources.includes(resource.id);

    const trigger = (
       <div className="flex items-center gap-4 w-full">
         {isManageMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange(resource.id, !!checked)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${resource.title}`}
          />
        )}
        <span className="text-left flex-1">{resource.title}</span>
       </div>
    );

    if (isManageMode) {
      return (
        <div key={resource.id}
          className={cn("flex items-center rounded-lg border px-4 transition-all cursor-pointer",
            isSelected ? 'ring-2 ring-primary bg-primary/10' : 'hover:shadow-md hover:-translate-y-1'
          )}
          onClick={() => onSelectionChange(resource.id, !isSelected)}
        >
          <div className="flex flex-1 items-center justify-between py-4 font-semibold">
            {trigger}
          </div>
        </div>
      );
    }
    
    return (
      <AccordionItem value={resource.id} key={resource.id} className="rounded-lg border px-4 transition-all hover:shadow-md hover:-translate-y-1">
        <AccordionTrigger className="py-4 font-semibold no-underline hover:no-underline">{trigger}</AccordionTrigger>
        <AccordionContent>
            <div className="aspect-video w-full rounded-lg border overflow-hidden">
            {youtubeVideoId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <iframe
                src={resource.url}
                className="h-full w-full"
                title={resource.title}
              />
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  });

  if (isManageMode) {
     return <div className="w-full space-y-2 pt-4">{content}</div>
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-2 pt-4">
      {content}
    </Accordion>
  );
}
