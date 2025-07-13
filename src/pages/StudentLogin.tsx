import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/loading-spinner';
import { studentLogin } from '@/lib/edge-functions/client';
import { storePassportCode, storeStudentData, getStoredPassportCode } from '@/lib/passport-auth';
import { KeyRound, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentLogin() {
  const [location, setLocation] = useLocation();
  const [passportCode, setPassportCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already logged in
  useEffect(() => {
    const storedCode = getStoredPassportCode();
    if (storedCode) {
      setLocation('/student/dashboard');
    }
  }, [setLocation]);

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

      // Navigate to dashboard
      setLocation('/student/dashboard');
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
    <div className="min-h-screen bg-gradient-to-br from-mint/20 to-soft-lime/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
              <KeyRound className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl">Welcome to Animal Genius!</CardTitle>
            <CardDescription>
              Enter your passport code to access your dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
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
                  Your teacher will give you this code after you complete the quiz
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || passportCode.length !== 7}
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    Enter My Dashboard
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Don't have a passport code yet?
              </p>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/')}
                className="w-full"
              >
                Take the Quiz First
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Lost your passport code? Ask your teacher for help.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
