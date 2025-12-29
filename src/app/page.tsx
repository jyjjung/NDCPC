
import { resources } from '@/lib/data';
import { ResourceTabs } from '@/components/ResourceTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddResourceForm } from '@/components/AddResourceForm';

export default function Home() {

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-3xl">Resource Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceTabs resources={resources} />
              </CardContent>
            </Card>
          </section>
        </div>
        <div className="md:col-span-1">
           <AddResourceForm />
        </div>
      </div>
    </div>
  );
}
