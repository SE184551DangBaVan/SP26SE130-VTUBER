'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/functions/Auth/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "@/firebase";
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import SideBar from '@/components/SideBar/SideBar';
import VirtualGremlin from '@/components/Gremlin_V-Pet/VirtualGremlin';
import ExplorePageComponent from '@/views/Users/ExplorePage/ExplorePage';

export default function ExplorePageRoute() {
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
    <div className="app">
      <Navbar LoggedIn={true}/>
      <SideBar displayName={user?.displayName}/>
      <VirtualGremlin />
      <ExplorePageComponent />
    </div>
  );
}
