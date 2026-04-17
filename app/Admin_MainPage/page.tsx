'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/functions/Auth/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "@/firebase";
import { useRouter } from 'next/navigation';
import AdminMainPage from '@/views/Admin/AdminControlCenter/AdminMainPage/AdminMainPage';
import LogoutButton from '@/functions/AccountActions/LogoutButton';

export default function AdminMainPageRoute() {
  const [user, setUser] = useState(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const { userAuth, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseLoading && !authLoading) {
      console.log(userAuth);
      if (!userAuth || userAuth.role !== 'ADMIN') {
        router.push('/login/admin');
      }
    }
  }, [userAuth, firebaseLoading, authLoading, router]);

  if (firebaseLoading || authLoading) return <div className="loader" />;
  
  // Only render if user has ADMIN role
  if (!userAuth || userAuth.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="app">
      <AdminMainPage />
      <LogoutButton />
    </div>
  );
}
