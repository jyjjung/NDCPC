
'use client'

import { AddResourceForm } from '@/components/AddResourceForm';
import { useAdmin } from '@/context/AdminProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function AddPage() {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <AddResourceForm />
      </div>
    </div>
  );
}
