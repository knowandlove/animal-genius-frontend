import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/loading-spinner';
import { studentLogin } from '@/lib/edge-functions/client';
import { storePassportCode, storeStudentData } from '@/lib/passport-auth';
import { useLocation } from 'wouter';
import { KeyRound } from 'lucide-react';

interface StudentPassportDialogProps {
  open: boolean;
  onClose: () => void;
  studentName?: string;
}

export default function StudentPassportDialog({ 
  open, 
  onClose,
  studentName 
}: StudentPassportDialogProps) {
  const [location, setLocation] = useLocation();
  const [passportCode, setPassportCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate passport code format
      const code = passportCode.toUpperCase().trim();
      if (!/^[A-Z]{3}-[A-Z0-9]{3}$/.test(code)) {
        throw new Error('Invalid passport code format. Expected format: XXX-XXX');
      }

      // Call Edge Function to validate passport
      const response = await studentLogin(code);
      
      if (!response.success) {
        throw new Error(response.message || 'Invalid passport code');
      }

      // Store passport code and student data
      storePassportCode(code);
      storeStudentData({
        id: response.student.id,
        name: response.student.name,
        animalType: response.student.animalType,
        geniusType: response.student.geniusType || '',
        classId: response.student.classId,
        passportCode: code,
        schoolYear: response.student.schoolYear,
      });

      // Navigate to student dashboard
      setLocation('/student/dashboard');
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your passport code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassportCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Auto-format with dash
    if (value.length === 3 && !value.includes('-')) {
      setPassportCode(value + '-');
    } else if (value.length <= 7) {
      setPassportCode(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center">
            {studentName ? `Welcome, ${studentName}!` : 'Enter Your Passport'}
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter your passport code to access your dashboard and room
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passport">Passport Code</Label>
            <Input
              id="passport"
              type="text"
              placeholder="XXX-XXX"
              value={passportCode}
              onChange={handlePassportCodeChange}
              className="text-center text-lg font-mono uppercase"
              autoComplete="off"
              autoFocus
              maxLength={7}
            />
            <p className="text-xs text-muted-foreground text-center">
              Example: OTT-X9K
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isLoading || passportCode.length !== 7}
            >
              {isLoading ? <LoadingSpinner /> : 'Enter'}
            </Button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Don't have a passport code? Ask your teacher.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
