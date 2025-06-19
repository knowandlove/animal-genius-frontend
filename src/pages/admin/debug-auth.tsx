import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function DebugAuth() {
  const { user, logout, refreshUser } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const checkToken = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTokenInfo(payload);
        
        // Also check what the backend expects
        console.log('Token payload:', payload);
        console.log('User ID field:', payload.userId || payload.id || 'NOT FOUND');
      } catch (e) {
        setTokenInfo({ error: 'Could not decode token' });
      }
    } else {
      setTokenInfo({ error: 'No token found' });
    }
  };

  const forceRefresh = async () => {
    await refreshUser();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current User:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Local Storage User:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {localStorage.getItem('user')}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={checkToken}>Check Token</Button>
              <Button onClick={forceRefresh} variant="outline">Force Refresh User</Button>
              <Button onClick={() => {
                logout();
                window.location.href = '/login';
              }} variant="destructive">Logout & Re-login</Button>
            </div>

            {tokenInfo && (
              <div>
                <h3 className="font-semibold mb-2">Token Info:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(tokenInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
