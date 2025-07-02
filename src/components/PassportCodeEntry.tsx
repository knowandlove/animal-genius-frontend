import { useState } from 'react';
import { useNavigate } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn } from 'lucide-react';
import { apiRequest } from '@/lib/api-request';

export function PassportCodeEntry() {
  const [, navigate] = useNavigate();
  const [passportCode, setPassportCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from session storage if available
  useState(() => {
    const savedCode = sessionStorage.getItem('lastPassportCode');
    if (savedCode) {
      setPassportCode(savedCode);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    const code = passportCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter your passport code');
      return;
    }

    // Allow both XXX-XXX and XXX-XXXX formats for backward compatibility
    if (!/^[A-Z]{3}-[A-Z0-9]{3,4}$/.test(code)) {
      setError('Invalid passport code format. Example: OWL-123');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('/api/room/authenticate', {
        method: 'POST',
        body: JSON.stringify({ passportCode: code })
      });

      if (response.success) {
        // Save to session storage for convenience
        sessionStorage.setItem('lastPassportCode', code);
        
        // Redirect to room
        navigate('/room');
      }
    } catch (err: any) {
      setError(err.error || 'Invalid passport code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPassportCode = (value: string) => {
    // Remove any non-alphanumeric characters
    let cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Add dash after 3 characters
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7); // Allow up to 4 chars after dash
    }
    
    return cleaned;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPassportCode(e.target.value);
    setPassportCode(formatted);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Your Room! 🏠</CardTitle>
          <CardDescription>
            Enter your passport code to visit your room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passportCode">Passport Code</Label>
              <Input
                id="passportCode"
                type="text"
                placeholder="ABC-123"
                value={passportCode}
                onChange={handleInputChange}
                className="text-center text-lg font-mono"
                maxLength={8} // XXX-XXXX
                disabled={isLoading}
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Your teacher will give you this code
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
              disabled={isLoading || !passportCode}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Enter Room
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Don't have a passport code?</p>
            <p>Ask your teacher to help you take the Animal Genius Quiz!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
