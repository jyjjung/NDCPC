"use client";

import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// In a real app, this would be a more secure secret, likely an environment variable.
const ADMIN_PASSWORD = "password123";

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const login = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      toast({
        title: "Success",
        description: "Logged in as administrator.",
      });
      return true;
    }
    toast({
      variant: "destructive",
      title: "Error",
      description: "Incorrect password.",
    });
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    toast({
      title: "Logged Out",
      description: "You have successfully logged out.",
    });
    router.push("/");
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
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
