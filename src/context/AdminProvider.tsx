
"use client";

import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check session storage for admin status
    const storedIsAdmin = sessionStorage.getItem('isAdmin');
    if (storedIsAdmin === 'true') {
      setIsAdmin(true);
    }
    setIsLoading(false);
  }, []);

  const login = (password: string) => {
    if (password === 'Admin123') {
      setIsAdmin(true);
      sessionStorage.setItem('isAdmin', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
    toast({
      title: "Logged Out",
      description: "You have successfully logged out.",
    });
    router.push("/");
  };

  const contextValue = {
    isAdmin,
    isLoading,
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
