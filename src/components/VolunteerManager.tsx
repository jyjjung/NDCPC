
"use client";

import { useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Volunteer } from "@/lib/types";
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Trash2 } from "lucide-react";
import { VolunteerForm } from "./VolunteerForm";
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
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

export function VolunteerManager() {
  const firestore = useFirestore();
  const [refresh, setRefresh] = useState(0);

  const volunteersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'volunteers'), orderBy('name'));
  }, [firestore]);

  const { data: volunteers, isLoading } = useCollection<Volunteer>(volunteersQuery);

  const handleDelete = async (volunteer: Volunteer) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, "volunteers", volunteer.id));
  };
  
  return (
    <div className="space-y-4">
      <VolunteerForm onSuccess={() => setRefresh(r => r + 1)} />
      <Separator />
      <h3 className="text-lg font-medium">Current Volunteers</h3>
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-2 pr-4">
            {volunteers && volunteers.length > 0 ? (
              volunteers.map(v => (
                <div key={v.id} className="flex items-center justify-between rounded-md border p-3">
                  <span>{v.name}</span>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                           <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {v.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove them from the list of volunteers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(v)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No volunteers added yet.</p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
