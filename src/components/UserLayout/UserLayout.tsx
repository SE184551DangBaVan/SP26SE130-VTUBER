'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from '@/functions/Auth/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "@/firebase";
import {usePathname, useRouter} from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import SideBar from '@/components/SideBar/SideBar';
import { SideBarProvider } from '@/contexts/SideBarContext';
import ChatBot from "@/components/ChatBot/ChatBot";
import VirtualGremlin from '@/components/Gremlin_V-Pet/VirtualGremlin';

interface UserLayoutProps {
  children: ReactNode;
}



export default function UserLayout({ children }: UserLayoutProps) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authen = useAuth();
  const userAuth = authen ? authen.userAuth : null;
  
  const containerRef = useRef(null);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setLoading(false);
    });

    const resolveSelectedPet = () => {
      const savedModel = sessionStorage.getItem('selectedPetModel');
      if (savedModel) {
        try {
          const parsed = JSON.parse(savedModel);
          if (parsed) {
            setSelectedPet(parsed);
            return;
          }
        } catch {
          // ignore malformed JSON
        }
      }

      const savedPet = sessionStorage.getItem('selectedPet');
      if (savedPet) {
        setSelectedPet(savedPet);
      } else {
        setSelectedPet(null);
      }
    };

    resolveSelectedPet();

    const handleSelectionChange = () => {
      resolveSelectedPet();
    };

    window.addEventListener('storage', handleSelectionChange);
    window.addEventListener('selectedPetChanged', handleSelectionChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleSelectionChange);
      window.removeEventListener('selectedPetChanged', handleSelectionChange);
    };
  }, []);


  if (loading) return <div className="loader" />;

  return (
    <SideBarProvider>
      <div className="app" ref={containerRef}>
          {userAuth && (<ChatBot/>)}
        <Navbar/>
        <SideBar />
        {selectedPet && <VirtualGremlin selectedPet={selectedPet} />}
        {children}
      </div>
    </SideBarProvider>
  );
}
