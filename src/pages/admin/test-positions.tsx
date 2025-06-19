import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

export default function TestPositions() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const data = await apiRequest('GET', '/api/item-positions');
      setPositions(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load positions:', error);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Item Positions API</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div>
              <p className="mb-4">Found {positions.length} positions in database:</p>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(positions, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
