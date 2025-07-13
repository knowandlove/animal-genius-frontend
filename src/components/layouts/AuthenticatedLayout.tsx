import { ReactNode, useEffect } from 'react';
import { TopBar } from '@/components/navigation/TopBar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  classId?: string;
  className?: string;
  classCode?: string;
  user?: { firstName: string; lastName: string; isAdmin?: boolean };
  onLogout?: () => void;
}

function AuthenticatedLayoutInner({
  children,
  showSidebar = false,
  classId,
  className,
  classCode,
  user,
  onLogout
}: AuthenticatedLayoutProps) {
  const { isCollapsed, isMobileOpen, toggleCollapse, toggleMobile, closeMobile } = useSidebar();

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    if (isMobileOpen) {
      const handleClickOutside = () => closeMobile();
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileOpen, closeMobile]);

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #d3f2ed 0%, #e8f7f3 40%, #f0faf7 100%)'
      }}
    >
      {/* Top Bar */}
      <TopBar 
        isAuthenticated={true}
        user={user}
        onLogout={onLogout}
        onToggleSidebar={toggleMobile}
        showSidebarToggle={showSidebar}
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <>
            <div className="hidden lg:block">
              <Sidebar
                classId={classId}
                className={className}
                classCode={classCode}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
              />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={closeMobile}
                />
                <div className="fixed left-0 top-16 bottom-0 z-50 lg:hidden">
                  <Sidebar
                    classId={classId}
                    className={className}
                    classCode={classCode}
                    isCollapsed={false}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-auto",
          showSidebar && !isCollapsed && "lg:ml-0", // Sidebar already takes space
          showSidebar && isCollapsed && "lg:ml-0"   // Sidebar already takes space
        )}>
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthenticatedLayout(props: AuthenticatedLayoutProps) {
  return (
    <SidebarProvider>
      <AuthenticatedLayoutInner {...props} />
    </SidebarProvider>
  );
}