
"use client";

import * as React from "react";
import { Resource, ResourceCategory } from "@/lib/types";
import { LoaderCircle } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ResourceListProps {
  category: ResourceCategory;
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


export function ResourceList({ category }: ResourceListProps) {
  const firestore = useFirestore();

  const resourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query all resources, order by creation date. Filtering will be done on the client.
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
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/40 p-12 text-center">
        <p className="text-muted-foreground">No {categoryLabels[category]} available at the moment.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-2 pt-4">
      {resources.map((resource) => {
        const youtubeVideoId = getYouTubeVideoId(resource.url);
        return (
          <AccordionItem value={resource.id} key={resource.id} className="rounded-lg border px-4 transition-all hover:shadow-md hover:-translate-y-1">
            <AccordionTrigger className="py-4 font-semibold no-underline hover:no-underline">{resource.title}</AccordionTrigger>
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
      })}
    </Accordion>
  );
}

