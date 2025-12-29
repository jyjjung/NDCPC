
import { getResources } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceList } from '@/components/ResourceList';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsPage() {
  const announcementResources = getResources('announcements');

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Announcements</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResourceList resources={announcementResources} category="announcements" />
        </CardContent>
      </Card>
    </div>
  );
}
