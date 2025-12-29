
'use client';

import Link from 'next/link';
import { Church } from 'lucide-react';
import { SidebarNav } from './SidebarNav';

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-background sm:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Church className="h-6 w-6 text-primary" />
          <span className="">NDC Preschool</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <SidebarNav />
      </div>
    </aside>
  );
}
