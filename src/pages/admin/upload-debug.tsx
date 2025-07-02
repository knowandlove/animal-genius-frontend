import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UploadDebug() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      setResult({ token: token ? `${token.slice(0, 20)}...` : 'No token' });
      
      // Test auth endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setResult(prev => ({ ...prev, user: data }));
      
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const testUpload = async () => {
    try {
      // Create a simple test image
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = '#FF0000';
      ctx!.fillRect(0, 0, 1, 1);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const formData = new FormData();
        formData.append('image', blob, 'test.png');
        formData.append('type', 'avatar_hat');
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/assets/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: formData,
        });
        
        const data = await response.json();
        setResult(prev => ({ 
          ...prev, 
          uploadStatus: response.status,
          uploadResponse: data 
        }));
        
      }, 'image/png');
      
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-x-4">
            <Button onClick={testAuth}>Test Auth</Button>
            <Button onClick={testUpload}>Test Upload</Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {result && (
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}