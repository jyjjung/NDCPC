
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Resource, ResourceCategory } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ResourceListProps {
  resources: Resource[];
  category: ResourceCategory;
}

const categoryLabels: Record<ResourceCategory, string> = {
  chants: "chants",
  songs: "songs",
  schedules: "schedules",
  announcements: "announcements",
};

export function ResourceList({ resources, category }: ResourceListProps) {
  if (resources.length === 0) {
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
           <Link href={`/resources/${resource.id}`} className="block">
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
