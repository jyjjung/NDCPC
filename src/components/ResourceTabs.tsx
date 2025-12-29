"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Resource, ResourceCategory } from "@/lib/types";
import { Mic, Music, CalendarDays, Megaphone, Video, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ResourceTabsProps {
  resources: Resource[];
}

const categoryConfig: Record<ResourceCategory, { icon: React.ElementType, label: string }> = {
  chants: { icon: Mic, label: "Chants" },
  songs: { icon: Music, label: "Songs" },
  schedules: { icon: CalendarDays, label: "Schedules" },
  announcements: { icon: Megaphone, label: "Announcements" },
  videos: { icon: Video, label: "Videos" },
};

export function ResourceTabs({ resources }: ResourceTabsProps) {
  const categories = Object.keys(categoryConfig) as ResourceCategory[];

  return (
    <Tabs defaultValue="songs" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        {categories.map((category) => (
          <TabsTrigger key={category} value={category} className="gap-2">
            {React.createElement(categoryConfig[category].icon, { className: "h-4 w-4" })}
            <span>{categoryConfig[category].label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((category) => {
        const categoryResources = resources.filter(res => res.category === category);
        return (
          <TabsContent key={category} value={category}>
            {categoryResources.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryResources.map((resource) => (
                  <Card key={resource.id} className="transition-all hover:shadow-md hover:-translate-y-1">
                     <Link href={resource.url} target="_blank" rel="noopener noreferrer" className="block">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{resource.title}</p>
                          <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/40 p-12 text-center">
                <p className="text-muted-foreground">No {categoryConfig[category].label.toLowerCase()} available at the moment.</p>
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
