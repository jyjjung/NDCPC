
'use client'

import { LoginForm } from "@/components/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/context/AdminProvider";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLoginPage() {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 py-12">
      <div className="w-full max-w-sm px-4">
        <Card className="w-full">
            <CardHeader className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 mb-4">
                <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Admin Access</CardTitle>
            <CardDescription>Please enter the password to manage content.</CardDescription>
            </CardHeader>
            <CardContent>
            <LoginForm />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
