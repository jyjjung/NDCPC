
'use client';
import { ScheduleManager } from "@/components/ScheduleManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { AdminGate } from "@/components/AdminGate";

export default function SchedulesPage() {
  return (
    <AdminGate>
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-headline text-3xl">Weekly Schedules</CardTitle>
              <CardDescription>Volunteer and staff schedule for Sunday service.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScheduleManager />
        </CardContent>
      </Card>
    </div>
    </AdminGate>
  );
}
