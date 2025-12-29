
'use client';
import { useState } from 'react';
import { ResourceList } from '@/components/ResourceList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddResourceForm } from '@/components/AddResourceForm';
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/context/AdminProvider';
import { AdminProvider } from '@/context/AdminProvider';

function VideosPageContent() {
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();

  const handleSelectionChange = (resourceId: string, isSelected: boolean) => {
    setSelectedResources(prev =>
      isSelected ? [...prev, resourceId] : prev.filter(id => id !== resourceId)
    );
  };

  const handleDeleteSelected = async () => {
    if (!firestore || selectedResources.length === 0) return;

    const batch = writeBatch(firestore);
    selectedResources.forEach(id => {
      const resourceRef = doc(firestore, 'resources', id);
      batch.delete(resourceRef);
    });

    try {
      await batch.commit();
      toast({
        title: 'Success',
        description: `${selectedResources.length} video(s) deleted.`,
      });
      setSelectedResources([]);
      setIsManageMode(false);
    } catch (error) {
      console.error('Error deleting resources: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete videos.',
      });
    }
  };

  const toggleManageMode = () => {
    if (isManageMode) {
      setSelectedResources([]);
    }
    setIsManageMode(!isManageMode);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Videos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
           <div className="flex justify-end gap-2 mt-4">
            {isAdmin && (
              <>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add Video
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Add a New Video</DialogTitle>
                    <DialogDescription>
                        Submit a YouTube URL for a new video.
                    </DialogDescription>
                    </DialogHeader>
                    <AddResourceForm
                    initialCategory={'videos'}
                    onSuccess={() => setIsAddOpen(false)}
                    />
                </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={toggleManageMode}>
                {isManageMode ? <X className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                {isManageMode ? 'Cancel' : 'Manage'}
                </Button>

                {isManageMode && selectedResources.length > 0 && (
                <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedResources.length})
                </Button>
                )}
              </>
            )}
        </div>
          <ResourceList
            category="videos"
            isManageMode={isManageMode}
            selectedResources={selectedResources}
            onSelectionChange={handleSelectionChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}


export default function VideosPage() {
    return (
        <AdminProvider>
            <VideosPageContent />
        </AdminProvider>
    )
}
