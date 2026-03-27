'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/functions/Auth/useAuth';
import { ThemeProvider } from '@/Context';
import ScrollToTop from '@/components/ScrollToTop/ScrollToTop';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

export default function Providers({ children }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    document.body.style.setProperty("--scroll", "0");
    window.addEventListener(
      "scroll",
      () => {
        document.body.style.setProperty(
          "--scroll",
          String(window.pageYOffset / (document.body.offsetHeight - window.innerHeight))
        );
      },
      false
    );
  }, [pathname]);

  if (!isClient) {
    return <div className="loader" />;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
        />
        <ScrollToTop />
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
