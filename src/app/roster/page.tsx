import { roster } from "@/lib/data";
import { RosterTable } from "@/components/RosterTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function RosterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-headline text-3xl">Weekly Roster</CardTitle>
              <CardDescription>Volunteer and staff schedule.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RosterTable initialRoster={roster} />
        </CardContent>
      </Card>
    </div>
  );
}
