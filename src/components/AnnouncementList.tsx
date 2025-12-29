
"use client";

import * as React from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { LoaderCircle, Trash2 } from "lucide-react";
import type { Announcement } from "@/lib/types";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useAdmin } from "@/context/AdminProvider";
import { Button } from "./ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


export function AnnouncementList() {
  const firestore = useFirestore();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  const announcementsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'announcements'),
      orderBy('date', 'desc')
    );
  }, [firestore]);

  const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

  const handleDelete = async (announcementId: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, "announcements", announcementId));
        toast({ title: 'Success', description: 'Announcement deleted.' });
    } catch (error) {
        console.error("Error deleting announcement: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete announcement.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading announcements...</p>
      </div>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/40 p-12 text-center mt-4">
        <p className="text-muted-foreground">No announcements available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{announcement.title}</CardTitle>
                        <CardDescription>
                            {announcement.date?.seconds ? format(new Date(announcement.date.seconds * 1000), 'PPP') : 'Just now'}
                        </CardDescription>
                    </div>
                    {isAdmin && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this announcement.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(announcement.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{announcement.content}</p>
            </CardContent>
        </Card>
      ))}
    </div>
  );
}
