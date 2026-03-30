'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/functions/Auth/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "@/firebase";
import {usePathname, useRouter} from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import SideBar from '@/components/SideBar/SideBar';
import { SideBarProvider } from '@/contexts/SideBarContext';
import ChatBot from "@/components/ChatBot/ChatBot";

interface UserLayoutProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ['/login', '/register', '/', '/user'];

export default function UserLayout({ children }: UserLayoutProps) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authen = useAuth();
  const userAuth = authen ? authen.userAuth : null;
  const router = useRouter();
  const pathName = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !userAuth) {
      const isPublicRoute = PUBLIC_ROUTES.some((route) => {
        if (route === '/user') {
          return pathName === '/user' || pathName.startsWith('/user/');
        }
        return pathName === route;
      });

      if (!isPublicRoute) {
        router.push('/login');
      }
    }
  }, [userAuth, loading, router, pathName]);

  if (loading) return <div className="loader" />;

  return (
    <SideBarProvider>
      <div className="app">
          {userAuth && (<ChatBot/>)}
        <Navbar LoggedIn={true}/>
        <SideBar />
        {/* <VirtualGremlin /> */}
        {children}
      </div>
    </SideBarProvider>
  );
}
