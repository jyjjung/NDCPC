
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { resources } from '@/lib/data';
import { ResourceTabs } from '@/components/ResourceTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddResourceForm } from '@/components/AddResourceForm';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="relative mb-12 h-64 w-full overflow-hidden rounded-lg shadow-lg md:h-80">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 bg-primary/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-primary-foreground">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-white drop-shadow-md md:text-6xl">
            NDC Preschooler's Church
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90 drop-shadow-sm">
            A joyful place for little ones to learn and grow in faith.
          </p>
        </div>
      </section>

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
