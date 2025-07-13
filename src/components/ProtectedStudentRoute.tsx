import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { getStoredPassportCode } from '@/lib/passport-auth';

interface ProtectedStudentRouteProps {
  children: React.ReactNode;
}

export function ProtectedStudentRoute({ children }: ProtectedStudentRouteProps) {
  const [, setLocation] = useLocation();
  const passportCode = getStoredPassportCode();

  useEffect(() => {
    if (!passportCode) {
      setLocation('/student-login');
    }
  }, [passportCode, setLocation]);

  if (!passportCode) {
    return null;
  }

  return <>{children}</>;
}
