
'use client';

import { useState } from 'react';
import { useAdmin } from '@/context/AdminProvider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Schedule } from '@/lib/types';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScheduleForm } from './ScheduleForm';
import { LoaderCircle, Plus, Trash2, Edit, Users } from 'lucide-react';
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
import { VolunteerManager } from './VolunteerManager';

export function ScheduleManager() {
  const { isAdmin } = useAdmin();
  const firestore = useFirestore();
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [isVolunteerManagerOpen, setIsVolunteerManagerOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: schedules, isLoading } = useCollection<Schedule>(schedulesQuery);

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setIsScheduleFormOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsScheduleFormOpen(true);
  };
  
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, "schedules", scheduleId));
  };


  const handleFormSuccess = () => {
    setIsScheduleFormOpen(false);
    setEditingSchedule(null);
  };

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" onClick={() => setIsVolunteerManagerOpen(true)}>
            <Users className="mr-2 h-4 w-4" /> Manage Volunteers
          </Button>
          <Button onClick={handleAddSchedule}>
            <Plus className="mr-2 h-4 w-4" /> Add Schedule
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (!schedules || schedules.length === 0) && (
        <p className="text-center text-muted-foreground mt-8">
          No schedules available yet.
        </p>
      )}

      {!isLoading && schedules && schedules.length > 0 && (
        <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Worship</TableHead>
              <TableHead>Offering</TableHead>
              <TableHead>Sermon Chant</TableHead>
              <TableHead>Activity</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map(schedule => (
              <TableRow key={schedule.id}>
                <TableCell className="font-semibold">
                  {schedule.date?.seconds ? format(new Date(schedule.date.seconds * 1000), 'PPP') : 'Invalid Date'}
                </TableCell>
                <TableCell>{schedule.worship}</TableCell>
                <TableCell>{schedule.offering}</TableCell>
                <TableCell>{schedule.sermonChant}</TableCell>
                <TableCell>{schedule.activity}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditSchedule(schedule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
                            This action cannot be undone. This will permanently delete the schedule for {schedule.date?.seconds ? format(new Date(schedule.date.seconds * 1000), 'PPP') : 'this date'}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSchedule(schedule.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      <Dialog open={isScheduleFormOpen} onOpenChange={setIsScheduleFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
          </DialogHeader>
          <ScheduleForm
            onSuccess={handleFormSuccess}
            schedule={editingSchedule}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isVolunteerManagerOpen} onOpenChange={setIsVolunteerManagerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Volunteers</DialogTitle>
          </DialogHeader>
          <VolunteerManager />
        </DialogContent>
      </Dialog>
    </div>
  );
}
