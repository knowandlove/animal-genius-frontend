import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useClassContext } from "@/hooks/useClassContext";
import { CollaboratorBadge } from "@/components/collaborators";

interface HeaderProps {
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  user?: { firstName: string; lastName: string; isAdmin?: boolean };
}

export default function Header({ isAuthenticated, onLogin, onLogout, user }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { className, role } = useClassContext();

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-3">
            <img 
              src="/images/KALlogocolor.svg" 
              alt="KAL Logo" 
              className="w-10 h-10"
            />
            <div className="flex flex-col leading-tight">
              <div className="font-heading text-foreground font-bold text-[16px] mt-[1px] mb-[1px]">Animal Genius Quiz®</div>
              <div className="font-body text-foreground/70 mt-[0px] mb-[0px] text-[12px]">Leadership Assessment for Kids</div>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="font-body text-muted-foreground hover:text-foreground px-3 py-2">
                  Dashboard
                </Link>
                <Link href="/create-class" className="font-body text-muted-foreground hover:text-foreground px-3 py-2">
                  Create Class
                </Link>
                <Link href="/account" className="font-body text-muted-foreground hover:text-foreground px-3 py-2">
                  My Account
                </Link>
                {user?.isAdmin && (
                  <Link href="/admin" className="font-body text-primary hover:text-accent px-3 py-2 font-semibold">
                    Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-body text-muted-foreground px-3 py-2">
                    Welcome, {user?.firstName}!
                  </span>
                  {className && role && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{className}</span>
                      <CollaboratorBadge role={role} size="sm" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <Button onClick={onLogout} variant="outline">
                    Sign Out
                  </Button>
                  <div className="mt-1 px-2 py-0.5 bg-white rounded text-black text-xs">
                    v1.1.6
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  Home
                </Link>
                <Button onClick={onLogin}>
                  Teacher Login
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
