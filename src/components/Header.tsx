
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Church, Menu, LogIn, LogOut, PlusCircle } from "lucide-react";
import { useAdmin } from "@/context/AdminProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Songs" },
  { href: "/chants", label: "Chants" },
  { href: "/schedules", label: "Schedules" },
  { href: "/announcements", label: "Announcements" },
  { href: "/roster", label: "Roster" },
];

export function Header() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAdmin();
  const [isSheetOpen, setSheetOpen] = useState(false);

  const navItems = (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "transition-colors hover:text-primary",
            pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground"
          )}
          onClick={() => setSheetOpen(false)}
        >
          {link.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/admin" ? "text-primary font-semibold" : "text-muted-foreground"
          )}
          onClick={() => setSheetOpen(false)}
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mr-2">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Link href="/" className="mr-6 flex items-center gap-2 mb-8" onClick={() => setSheetOpen(false)}>
                  <Church className="h-6 w-6 text-primary" />
                  <span className="font-bold font-headline">NDC Preschool</span>
                </Link>
                <nav className="flex flex-col items-start gap-6 text-lg">
                  {navItems}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Church className="h-6 w-6 text-primary" />
          <span className="hidden font-bold font-headline sm:inline-block">NDC Preschool</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
           <Button asChild variant="outline" size="sm">
              <Link href="/add">
                <PlusCircle />
                <span className="hidden sm:inline-block">Add Resource</span>
              </Link>
            </Button>
          {isAdmin ? (
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut />
              <span className="hidden sm:inline-block">Logout</span>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/login">
                <LogIn />
                 <span className="hidden sm:inline-block">Admin Login</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
