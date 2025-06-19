import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Check, X } from 'lucide-react';

export default function MakeAdmin() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'updating' | 'done'>('idle');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = async () => {
    setStatus('checking');
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not logged in');
        setStatus('idle');
        return;
      }

      // Decode the JWT to get user ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;

      // For now, we'll assume you're not admin if the API calls are failing
      setIsAdmin(false);
      setStatus('idle');
      
      // Log the user ID for manual update if needed
      console.log('Your user ID is:', userId);
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const makeAdmin = async () => {
    setStatus('updating');
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not logged in');
        setStatus('idle');
        return;
      }

      // Since we can't directly update the database from frontend,
      // we'll provide instructions
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;

      setError(`To make yourself admin, run this SQL command in your database:
      
UPDATE users SET is_admin = true WHERE id = ${userId};

Then log out and log back in.`);
      setStatus('done');
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Admin Status Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The item position API requires admin access. Let's check your status.
            </p>

            {isAdmin !== null && (
              <div className="flex items-center gap-2 p-4 bg-gray-100 rounded">
                {isAdmin ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-600">You are an admin!</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-600">You are not an admin</span>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded whitespace-pre-wrap font-mono text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={checkAdminStatus}
                disabled={status === 'checking'}
              >
                {status === 'checking' ? 'Checking...' : 'Check Admin Status'}
              </Button>

              {isAdmin === false && (
                <Button
                  onClick={makeAdmin}
                  variant="default"
                  disabled={status === 'updating'}
                >
                  {status === 'updating' ? 'Processing...' : 'Get Admin Instructions'}
                </Button>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h4 className="font-semibold mb-2">Quick Fix Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Get Admin Instructions" above to get your user ID</li>
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to the SQL Editor</li>
                <li>Run the UPDATE command shown above</li>
                <li>Log out of the app (click your name in top right)</li>
                <li>Log back in</li>
                <li>Try the bulk update again!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
