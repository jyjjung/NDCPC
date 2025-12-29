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
import { useState } from "react";

interface RosterTableProps {
  initialRoster: RosterMember[];
}

export function RosterTable({ initialRoster }: RosterTableProps) {
  const [roster, setRoster] = useState<RosterMember[]>(initialRoster);
  
  // Group roster by week
  const rosterByWeek = roster.reduce((acc, member) => {
    (acc[member.week] = acc[member.week] || []).push(member);
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
