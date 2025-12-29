
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RosterMember } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { LoaderCircle } from "lucide-react";

export function RosterTable() {
  const firestore = useFirestore();

  const rosterQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'roster_entries'));
  }, [firestore]);

  const { data: roster, isLoading } = useCollection<RosterMember>(rosterQuery);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!roster || roster.length === 0) {
    return <p className="text-muted-foreground">No roster information available.</p>
  }

  // Group roster by week
  const rosterByWeek = roster.reduce((acc, member) => {
    const week = member.week || 'Uncategorized';
    (acc[week] = acc[week] || []).push(member);
    return acc;
  }, {} as Record<string, RosterMember[]>);


  return (
    <div className="space-y-8">
      {Object.entries(rosterByWeek).map(([week, members]) => (
        <div key={week}>
          <h3 className="mb-4 text-xl font-semibold font-headline">{week}</h3>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Name</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
