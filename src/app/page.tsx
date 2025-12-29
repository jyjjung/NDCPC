
'use client';
import { useState } from 'react';
import { ResourceList } from '@/components/ResourceList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Mic, Plus, Trash2, X } from 'lucide-react';
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
import { useAdmin } from '@/context/AdminProvider';
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState('songs');
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

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
        description: `${selectedResources.length} resource(s) deleted.`,
      });
      setSelectedResources([]);
      setIsManageMode(false);
    } catch (error) {
      console.error('Error deleting resources: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete resources.',
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
      <h1 className="text-3xl font-headline mb-6">Resources</h1>
      <Tabs defaultValue="songs" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="songs">
            <Music className="mr-2 h-4 w-4" />
            Songs
          </TabsTrigger>
          <TabsTrigger value="chants">
            <Mic className="mr-2 h-4 w-4" />
            Chants
          </TabsTrigger>
        </TabsList>

        <div className="flex justify-end gap-2 mt-4">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add Resource
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Add a New Resource</DialogTitle>
                <DialogDescription>
                    Submit a YouTube URL for a new song or chant.
                </DialogDescription>
                </DialogHeader>
                <AddResourceForm
                initialCategory={activeTab as 'songs' | 'chants'}
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
        </div>

        <TabsContent value="songs">
          <ResourceList
            category="songs"
            isManageMode={isManageMode}
            selectedResources={selectedResources}
            onSelectionChange={handleSelectionChange}
          />
        </TabsContent>
        <TabsContent value="chants">
          <ResourceList
            category="chants"
            isManageMode={isManageMode}
            selectedResources={selectedResources}
            onSelectionChange={handleSelectionChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
