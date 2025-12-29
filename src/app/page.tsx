
'use client';
import { ResourceList } from '@/components/ResourceList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Songs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResourceList category="songs" />
        </CardContent>
      </Card>
    </div>
  );
}
