
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Plus } from 'lucide-react';
import { useAdmin } from '@/context/AdminProvider';
import { AnnouncementList } from '@/components/AnnouncementList';
import { AddAnnouncementForm } from '@/components/AddAnnouncementForm';

export default function AnnouncementsPage() {
  const { isAdmin } = useAdmin();
  const [isAddOpen, setIsAddOpen] = useState(false);

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
            {isAdmin && (
              <div className="flex justify-end pt-4">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create a New Announcement</DialogTitle>
                      <DialogDescription>
                        Write a title and content for the announcement. It will be visible to everyone.
                      </DialogDescription>
                    </DialogHeader>
                    <AddAnnouncementForm
                      onSuccess={() => setIsAddOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <AnnouncementList />
          </CardContent>
        </Card>
      </div>
  );
}
