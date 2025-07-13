import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapse: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Close mobile sidebar when screen becomes large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  const toggleCollapse = () => setIsCollapsed(prev => !prev);
  const toggleMobile = () => setIsMobileOpen(prev => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      isMobileOpen,
      toggleCollapse,
      toggleMobile,
      closeMobile
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}