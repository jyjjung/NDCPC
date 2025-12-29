
"use client";

import { useAdmin } from "@/context/AdminProvider";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAdmin) {
        router.replace("/admin/login");
      } else {
        setIsVerified(true);
      }
    }
  }, [isAdmin, isLoading, router]);

  if (!isVerified || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-9 w-48" />
            </div>
            <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4 pt-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
