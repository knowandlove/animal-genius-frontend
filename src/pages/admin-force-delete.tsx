import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/config/api';

export default function AdminForceDelete() {
  const [classId, setClassId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [, setLocation] = useLocation();

  const handleForceDelete = async () => {
    if (!classId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a class ID' });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(api(`/api/admin/classes/${classId}/force`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Class deleted successfully!' });
        setClassId('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete class' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{
      background: 'linear-gradient(135deg, #d3f2ed 0%, #e8f7f3 40%, #f0faf7 100%)'
    }}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Force Delete Class (Admin Tool)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Warning:</strong> This will permanently delete the class and ALL associated data including:
                <ul className="list-disc list-inside mt-2">
                  <li>All students in the class</li>
                  <li>All quiz submissions</li>
                  <li>All currency transactions</li>
                  <li>All purchase requests</li>
                  <li>All lesson progress</li>
                </ul>
                This action cannot be undone!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label htmlFor="classId" className="text-sm font-medium">
                Class ID (UUID)
              </label>
              <Input
                id="classId"
                type="text"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="e.g., c58909f8-912b-48fb-885d-6838000e11c0"
                disabled={isDeleting}
              />
              <p className="text-xs text-gray-500">
                You can find the class ID in the URL when viewing the class analytics
              </p>
            </div>

            {message && (
              <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
                <AlertDescription
                  className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}
                >
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button
                onClick={handleForceDelete}
                disabled={isDeleting}
                variant="destructive"
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Force Delete Class'}
              </Button>
              <Button
                onClick={() => setLocation('/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
