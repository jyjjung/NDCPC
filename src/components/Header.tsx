"use client";

import Link from "next/link";
import { Church, Menu, LogIn, LogOut } from "lucide-react";
import { useAdmin } from "@/context/AdminProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { SidebarNav } from "./SidebarNav";

export function Header() {
  const { isAdmin, logout } = useAdmin();
  const [isSheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="sm:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mr-4">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                 <Link href="/" className="mb-6 flex items-center gap-2" onClick={() => setSheetOpen(false)}>
                  <Church className="h-6 w-6 text-primary" />
                  <span className="font-bold font-headline">NDC Preschool</span>
                </Link>
                <SidebarNav onLinkClick={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
        <Link href="/" className="mr-6 flex items-center gap-2 sm:hidden">
          <Church className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline sm:inline-block">NDC Preschool Church</span>
        </Link>


        <div className="flex flex-1 items-center justify-end gap-2">
          {isAdmin ? (
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 sm:mr-2"/>
              <span className="hidden sm:inline-block">Logout</span>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/login">
                <LogIn className="h-4 w-4 sm:mr-2" />
                 <span className="hidden sm:inline-block">Admin Login</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
