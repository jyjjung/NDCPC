'use client';

import { useState } from 'react';
import { ResourceList } from '@/components/ResourceList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Music, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddResourceForm } from '@/components/AddResourceForm';
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/context/LocaleProvider';

export default function ResourcesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('songs');
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSelectionChange = (resourceId: string, isSelected: boolean) => {
    setSelectedResources((prev) =>
      isSelected ? [...prev, resourceId] : prev.filter((id) => id !== resourceId)
    );
  };

  const handleDeleteSelected = async () => {
    if (!firestore || selectedResources.length === 0) return;

    const batch = writeBatch(firestore);
    selectedResources.forEach((id) => {
      batch.delete(doc(firestore, 'resources', id));
    });

    try {
      await batch.commit();
      toast({ title: t('toast.deleted') });
      setSelectedResources([]);
      setIsManageMode(false);
    } catch (error) {
      console.error('Error deleting resources: ', error);
      toast({ variant: 'destructive', title: t('toast.couldntDeleteMany') });
    }
  };

  const toggleManageMode = () => {
    if (isManageMode) {
      setSelectedResources([]);
    }
    setIsManageMode(!isManageMode);
  };

  const addLabel = activeTab === 'songs' ? t('resources.addSong') : t('resources.addChant');
  const dialogTitle = activeTab === 'songs' ? t('resources.addSong') : t('resources.addChant');

  return (
    <PageShell title={t('nav.resources')} wide>
      <Tabs defaultValue="songs" className="w-full" onValueChange={setActiveTab}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto gap-4 bg-transparent p-0">
            <TabsTrigger
              value="songs"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Music className="h-4 w-4" />
              {t('resources.songs')}
            </TabsTrigger>
            <TabsTrigger
              value="chants"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Mic className="h-4 w-4" />
              {t('resources.chants')}
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-1">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  {addLabel}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <AddResourceForm
                  initialCategory={activeTab as 'songs' | 'chants'}
                  onSuccess={() => setIsAddOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={toggleManageMode}>
              {isManageMode ? (
                <>
                  <X className="mr-1.5 h-4 w-4" />
                  {t('common.done')}
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  {t('common.manage')}
                </>
              )}
            </Button>

            {isManageMode && selectedResources.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                {t('common.delete')} ({selectedResources.length})
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="songs" className="mt-0">
          <ResourceList
            category="songs"
            isManageMode={isManageMode}
            selectedResources={selectedResources}
            onSelectionChange={handleSelectionChange}
          />
        </TabsContent>
        <TabsContent value="chants" className="mt-0">
          <ResourceList
            category="chants"
            isManageMode={isManageMode}
            selectedResources={selectedResources}
            onSelectionChange={handleSelectionChange}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
