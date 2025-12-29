
'use client';
import { ResourceList } from '@/components/ResourceList';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Music, Mic } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline mb-6">Resources</h1>
      <Accordion type="single" collapsible defaultValue="songs" className="w-full">
        <AccordionItem value="songs">
          <AccordionTrigger>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <span className="font-headline text-2xl">Songs</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ResourceList category="songs" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="chants">
          <AccordionTrigger>
             <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <span className="font-headline text-2xl">Chants</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ResourceList category="chants" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
