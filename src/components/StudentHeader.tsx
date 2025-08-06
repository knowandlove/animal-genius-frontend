import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User } from 'lucide-react';
import { getStoredStudentData, logoutStudent, getStoredPassportCode } from '@/lib/passport-auth';
import { cn } from '@/lib/utils';

interface StudentHeaderProps {
  className?: string;
  showLogout?: boolean;
  variant?: 'default' | 'minimal';
}

export function StudentHeader({ 
  className, 
  showLogout = true,
  variant = 'default' 
}: StudentHeaderProps) {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState(getStoredStudentData());
  const passportCode = getStoredPassportCode();

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      setStudentData(getStoredStudentData());
    };

    window.addEventListener('student-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('student-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    logoutStudent();
    setLocation('/');
  };

  if (!studentData && !passportCode) {
    return null;
  }

  const studentName = studentData?.name || 'Student';
  const displayPassport = studentData?.passportCode || passportCode || '';

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{studentName}</span>
        <Badge variant="secondary" className="font-mono text-xs">
          {displayPassport}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-sm shadow-sm border-b",
      className
    )}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Student info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">
                  {studentName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {studentData?.animalType || 'Student'}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {displayPassport}
            </Badge>
          </div>

          {/* Right side - Actions */}
          {showLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}