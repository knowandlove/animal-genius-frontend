import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { storePassportCode, storeStudentData } from '@/lib/passport-auth';
import { useToast } from '@/hooks/use-toast';
import { Sprout, Loader2 } from 'lucide-react';

export default function StudentEntry() {
  const [passportCode, setPassportCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const formatPassportCode = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Add hyphen after 3 characters
    if (cleaned.length > 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
    }
    return cleaned;
  };

  const handlePassportCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPassportCode(e.target.value);
    setPassportCode(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passportCode.length !== 7) {
      toast({
        title: "Invalid Code",
        description: "Please enter your complete passport code (XXX-XXX)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/student-passport/validate', {
        passportCode,
      });

      if (response.valid && response.student) {
        storePassportCode(passportCode);
        storeStudentData(response.student);
        
        toast({
          title: "Welcome back!",
          description: `Hello ${response.student.name}! Taking you to your dashboard...`,
        });

        // Redirect to student dashboard
        setTimeout(() => {
          setLocation('/student/dashboard');
        }, 1000);
      } else {
        throw new Error('Invalid passport code');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your passport code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="inline-block"
            >
              <Sprout className="w-16 h-16 text-green-600 mx-auto mb-2" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">Welcome to Animal Genius!</CardTitle>
            <CardDescription>
              Enter your passport code to visit your grow zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passportCode" className="text-base">
                  Passport Code
                </Label>
                <Input
                  id="passportCode"
                  type="text"
                  placeholder="ABC-123"
                  value={passportCode}
                  onChange={handlePassportCodeChange}
                  maxLength={7}
                  className="text-center text-2xl font-mono tracking-wider h-16"
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground text-center">
                  Ask your teacher for your passport code
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={isLoading || passportCode.length !== 7}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Sprout className="mr-2 h-5 w-5" />
                    Go to My Grow Zone
                  </>
                )}
              </Button>
            </form>

            {/* Fun animal emojis */}
            <div className="mt-6 flex justify-center gap-3 text-2xl">
              {['🦫', '🐼', '🦉', '🦝', '🐘', '🦦', '🦜', '🐕'].map((emoji, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 0 }}
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}