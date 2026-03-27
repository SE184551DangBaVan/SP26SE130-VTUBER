'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/functions/Auth/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "@/firebase";
import Navbar from '@/components/Navbar/Navbar';
import LandingPage from '@/views/LandingPage/LandingPage';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authen = useAuth();
  const userAuth = authen ? authen.userAuth : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loader" />;

  return (
    <div className="app">
      {userAuth ? (<Navbar LoggedIn={true}/>) : (<Navbar LoggedIn={false}/>)}
      <LandingPage />
    </div>
  );
}
