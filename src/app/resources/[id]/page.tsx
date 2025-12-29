
import { getResources } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function getYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function ResourcePage({ params }: { params: { id: string } }) {
  const resource = getResources().find((res) => res.id === params.id);

  if (!resource) {
    notFound();
  }

  const youtubeVideoId = getYouTubeVideoId(resource.url);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href={`/${resource.category}`} className="gap-2">
            <ArrowLeft />
            Back to Resources
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{resource.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full rounded-lg border overflow-hidden">
            {youtubeVideoId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <iframe
                src={resource.url}
                className="h-full w-full"
                title={resource.title}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
