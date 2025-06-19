import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestAdmin() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAdminAccess = async () => {
    setLoading(true);
    setResult(null);
    
    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    
    try {
      // First, test the /api/me endpoint
      const meResponse = await fetch(`${apiUrl}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const meData = await meResponse.json();
      
      // Then test the admin endpoint
      const adminResponse = await fetch(`${apiUrl}/api/admin/item-positions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const adminResult = {
        status: adminResponse.status,
        statusText: adminResponse.statusText,
        body: await adminResponse.text()
      };
      
      setResult({
        meEndpoint: meData,
        adminEndpoint: adminResult,
        tokenPayload: JSON.parse(atob(token.split('.')[1]))
      });
      
    } catch (error: any) {
      setResult({ error: error.message });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testAdminAccess} disabled={loading}>
              {loading ? 'Testing...' : 'Test Admin Access'}
            </Button>
            
            {result && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">/api/me Response:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(result.meEndpoint, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Admin Endpoint Response:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(result.adminEndpoint, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Token Payload:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(result.tokenPayload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
