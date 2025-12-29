
import { getResources } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceList } from '@/components/ResourceList';

export default function Home() {
  const songResources = getResources('songs');

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Songs</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceList resources={songResources} category="songs" />
        </CardContent>
      </Card>
    </div>
  );
}
