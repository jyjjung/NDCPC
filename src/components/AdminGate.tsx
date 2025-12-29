"use client";

import { useAdmin } from "@/context/AdminProvider";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/admin/login");
    } else {
      setIsVerified(true);
    }
  }, [isAdmin, router]);

  if (!isVerified) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <div className="space-y-4 pt-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
