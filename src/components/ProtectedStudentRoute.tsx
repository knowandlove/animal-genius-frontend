import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/api-request';
import { PassportCodeEntry } from '@/components/PassportCodeEntry';
import { Loader2 } from 'lucide-react';

interface ProtectedStudentRouteProps {
  children: React.ReactNode;
}

export function ProtectedStudentRoute({ children }: ProtectedStudentRouteProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await apiRequest('/api/island/check-session');
      if (response.authenticated) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Not authenticated
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PassportCodeEntry />;
  }

  return <>{children}</>;
}
