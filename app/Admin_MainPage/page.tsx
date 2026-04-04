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
  const [loading, setLoading] = useState(true);
  const authen = useAuth();
  const userAuth = authen ? authen.userAuth : null;
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Redirect to admin login if not authenticated or not ADMIN role
      if (!userAuth || userAuth.role !== 'ADMIN') {
        router.push('/login/admin');
      }
    }
  }, [userAuth, loading, router]);

  if (loading) return <div className="loader" />;
  
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
