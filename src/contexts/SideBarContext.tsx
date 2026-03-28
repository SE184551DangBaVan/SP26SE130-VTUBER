'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SideBarContextType {
  sideBarSelected: string;
  setSideBarSelected: (selected: string) => void;
}

const SideBarContext = createContext<SideBarContextType | undefined>(undefined);

export function SideBarProvider({ children }: { children: ReactNode }) {
  const [sideBarSelected, setSideBarSelectedState] = useState("home");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sideBarSelected');
    if (saved) {
      setSideBarSelectedState(saved);
    }
    setIsInitialized(true);
  }, []);

  const setSideBarSelected = (selected: string) => {
    setSideBarSelectedState(selected);
    localStorage.setItem('sideBarSelected', selected);
  };

  // Don't render children until localStorage is loaded
  if (!isInitialized) {
    return null;
  }

  return (
    <SideBarContext.Provider value={{ sideBarSelected, setSideBarSelected }}>
      {children}
    </SideBarContext.Provider>
  );
}

export function useSideBar() {
  const context = useContext(SideBarContext);
  if (context === undefined) {
    throw new Error('useSideBar must be used within a SideBarProvider');
  }
  return context;
}
