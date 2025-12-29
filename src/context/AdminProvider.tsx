
"use client";

import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, ReactNode } from "react";
import { useUser, useAuth, initiateEmailSignIn } from "@/firebase";
import { signOut } from "firebase/auth";

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = !!user;

  const login = (password: string) => {
    // In a real app, you'd use the admin SDK to verify a user is an admin.
    // For now, any signed-in user is considered an admin.
    // The password from the form is used with a hardcoded email.
    initiateEmailSignIn(auth, "admin@example.com", password);
    // Note: We can't immediately know if login was successful here
    // due to the non-blocking nature. We rely on the `useUser` hook to update.
    // A more robust solution might involve checking for errors.
    return true; // Optimistically return true.
  };

  const logout = () => {
    signOut(auth).then(() => {
      toast({
        title: "Logged Out",
        description: "You have successfully logged out.",
      });
      router.push("/");
    });
  };

  const contextValue = {
    isAdmin: !isUserLoading && isAdmin,
    login,
    logout,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
