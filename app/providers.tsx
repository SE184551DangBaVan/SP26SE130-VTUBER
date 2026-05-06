'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/functions/Auth/useAuth';
import { ThemeProvider } from '@/Context';
import { ReportModalProvider } from '@/contexts/ReportContext';
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

    let rafId: number | null = null;

    const updateScrollProgress = () => {
      const scrollableHeight = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const scrollProgress = Math.min(
        1,
        Math.max(0, window.scrollY / scrollableHeight)
      );

      document.body.style.setProperty("--scroll", String(scrollProgress));
      rafId = null;
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateScrollProgress);
    };

    updateScrollProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [pathname]);

  if (!isClient) {
    return <div className="loader" />;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <ReportModalProvider>
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
        </ReportModalProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
