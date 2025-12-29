
'use client'

import { LoginForm } from "@/components/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminProvider } from "@/context/AdminProvider";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  return (
        <AdminProvider>
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
      </AdminProvider>
  );
}
