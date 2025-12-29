
'use client';
import { ResourceList } from '@/components/ResourceList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Mic } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline mb-6">Resources</h1>
      <Tabs defaultValue="songs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="songs">
            <Music className="mr-2 h-4 w-4" />
            Songs
          </TabsTrigger>
          <TabsTrigger value="chants">
            <Mic className="mr-2 h-4 w-4" />
            Chants
          </TabsTrigger>
        </TabsList>
        <TabsContent value="songs">
          <ResourceList category="songs" />
        </TabsContent>
        <TabsContent value="chants">
          <ResourceList category="chants" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
