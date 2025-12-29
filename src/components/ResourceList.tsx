
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Resource, ResourceCategory } from "@/lib/types";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

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
    <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <Card key={resource.id} className="transition-all hover:shadow-md hover:-translate-y-1">
           <Link href={`/resources/${resource.id}?category=${category}`} className="block">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{resource.title}</p>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
