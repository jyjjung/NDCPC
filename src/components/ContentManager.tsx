
"use client";

import { Resource } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, doc, orderBy } from "firebase/firestore";
import { LoaderCircle, Trash2 } from "lucide-react";
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

export function ContentManager() {
  const firestore = useFirestore();

  const resourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'resources'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allResources, isLoading } = useCollection<Resource>(resourcesQuery);
  
  const handleDelete = (resourceId: string) => {
    if (!firestore) return;
    const resourceRef = doc(firestore, 'resources', resourceId);
    deleteDocumentNonBlocking(resourceRef);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Existing Resources</CardTitle>
          </CardHeader>
          <CardContent>
            {!allResources || allResources.length === 0 ? (
               <p className="text-muted-foreground">No resources found.</p>
            ) : (
            <ul className="space-y-2">
              {allResources.map((res) => (
                <li key={res.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-semibold">{res.title}</p>
                    <p className="text-sm text-muted-foreground capitalize">{res.category}</p>
                  </div>
                  <div className="space-x-2">
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the resource
                            <span className="font-semibold">"{res.title}"</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(res.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
