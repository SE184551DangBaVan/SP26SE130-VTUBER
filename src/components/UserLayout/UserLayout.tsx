'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/functions/Auth/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "@/firebase";
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import SideBar from '@/components/SideBar/SideBar';
import VirtualGremlin from '@/components/Gremlin_V-Pet/VirtualGremlin';
import { SideBarProvider } from '@/contexts/SideBarContext';

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
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
    if (!loading && !userAuth) {
      router.push('/login');
    }
  }, [userAuth, loading, router]);

  if (loading) return <div className="loader" />;
  if (!userAuth) return null;

  return (
    <SideBarProvider>
      <div className="app">
        <Navbar LoggedIn={true}/>
        <SideBar />
        <VirtualGremlin />
        {children}
      </div>
    </SideBarProvider>
  );
}
