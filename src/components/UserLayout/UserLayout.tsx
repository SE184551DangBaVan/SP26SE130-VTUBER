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
        // 1. Wait until Firebase/Auth is done loading
        if (loading) return;

        // 2. Define if the current path is public
        const isPublicRoute = PUBLIC_ROUTES.some((route) => {
            if (route === '/') return pathName === '/'; // Exact match for home
            return pathName === route || pathName.startsWith(`${route}/`);
        });

        // 3. If NOT public and NOT logged in, kick them to login
        if (!userAuth && !isPublicRoute) {
            router.push('/login');
        }
    }, [userAuth, loading, pathName, router]);


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
