
"use client";

import { AdminGate } from "@/components/AdminGate";
import { ContentManager } from "@/components/ContentManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <AdminGate>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Admin Dashboard</CardTitle>
            <CardDescription>Manage resources, announcements, and schedules.</CardDescription>
          </CardHeader>
          <CardContent>
            <ContentManager />
          </CardContent>
        </Card>
      </div>
    </AdminGate>
  );
}
