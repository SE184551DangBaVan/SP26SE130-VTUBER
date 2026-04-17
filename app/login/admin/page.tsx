'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/functions/Auth/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "@/firebase";
import { useRouter } from 'next/navigation';
import AdminLogin from '@/views/Admin/AdminLogin/AdminLogin';

export default function AdminLoginPage() {
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
    if (!firebaseLoading && !authLoading && userAuth) {
      if (userAuth.role === 'ADMIN') {
        router.push('/Admin_MainPage');
      } else {
        router.push('/');
      }
    }
  }, [userAuth, firebaseLoading, authLoading, router]);

  if (firebaseLoading || authLoading) return <div className="loader" />;
  if (userAuth) return null;

  return (
    <div className="app">
      <AdminLogin />
    </div>
  );
}
