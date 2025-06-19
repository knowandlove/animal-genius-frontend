import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// Import the positions data
const positions = {
  "explorer": {
    "meerkat": { "x": 51, "y": 26, "scale": 0.45, "rotation": 0 },
    "panda": { "x": 51, "y": 26, "scale": 0.45, "rotation": 0 },
    "owl": { "x": 51, "y": 26, "scale": 0.45, "rotation": 0 },
    "beaver": { "x": 51, "y": 26, "scale": 0.45, "rotation": 0 },
    "elephant": { "x": 51, "y": 26, "scale": 0.45, "rotation": 0 },
    "otter": { "x": 51, "y": 26, "scale": 0.45, "rotation": 0 },
    "parrot": { "x": 51, "y": 26, "scale": 0.45, "rotation": 0 },
    "border-collie": { "x": 51, "y": 26, "scale": 0.45, "rotation": 0 }
  },
  "safari": {
    "meerkat": { "x": 51, "y": 26, "scale": 0.5, "rotation": -5 },
    "panda": { "x": 51, "y": 26, "scale": 0.5, "rotation": -5 },
    "owl": { "x": 51, "y": 26, "scale": 0.5, "rotation": -5 },
    "beaver": { "x": 51, "y": 26, "scale": 0.5, "rotation": -5 },
    "elephant": { "x": 51, "y": 26, "scale": 0.5, "rotation": -5 },
    "otter": { "x": 51, "y": 26, "scale": 0.5, "rotation": -5 },
    "parrot": { "x": 51, "y": 26, "scale": 0.5, "rotation": -5 },
    "border-collie": { "x": 51, "y": 26, "scale": 0.5, "rotation": -5 }
  },
  "greenblinds": {
    "meerkat": { "x": 51, "y": 32, "scale": 0.4, "rotation": 0 },
    "panda": { "x": 51, "y": 32, "scale": 0.4, "rotation": 0 },
    "owl": { "x": 51, "y": 32, "scale": 0.4, "rotation": 0 },
    "beaver": { "x": 51, "y": 32, "scale": 0.4, "rotation": 0 },
    "elephant": { "x": 51, "y": 32, "scale": 0.4, "rotation": 0 },
    "otter": { "x": 51, "y": 32, "scale": 0.4, "rotation": 0 },
    "parrot": { "x": 51, "y": 32, "scale": 0.4, "rotation": 0 },
    "border-collie": { "x": 51, "y": 32, "scale": 0.4, "rotation": 0 }
  },
  "hearts": {
    "meerkat": { "x": 52, "y": 32, "scale": 0.45, "rotation": 0 },
    "panda": { "x": 52, "y": 32, "scale": 0.45, "rotation": 0 },
    "owl": { "x": 52, "y": 32, "scale": 0.45, "rotation": 0 },
    "beaver": { "x": 52, "y": 32, "scale": 0.45, "rotation": 0 },
    "elephant": { "x": 52, "y": 32, "scale": 0.45, "rotation": 0 },
    "otter": { "x": 52, "y": 32, "scale": 0.45, "rotation": 0 },
    "parrot": { "x": 52, "y": 32, "scale": 0.45, "rotation": 0 },
    "border-collie": { "x": 52, "y": 32, "scale": 0.45, "rotation": 0 }
  },
  "bow_tie": {
    "meerkat": { "x": 51, "y": 40, "scale": 0.4, "rotation": 0 },
    "panda": { "x": 51, "y": 40, "scale": 0.4, "rotation": 0 },
    "owl": { "x": 51, "y": 40, "scale": 0.4, "rotation": 0 },
    "beaver": { "x": 51, "y": 40, "scale": 0.4, "rotation": 0 },
    "elephant": { "x": 51, "y": 40, "scale": 0.4, "rotation": 0 },
    "otter": { "x": 51, "y": 40, "scale": 0.4, "rotation": 0 },
    "parrot": { "x": 51, "y": 40, "scale": 0.4, "rotation": 0 },
    "border-collie": { "x": 51, "y": 40, "scale": 0.4, "rotation": 0 }
  },
  "necklace": {
    "meerkat": { "x": 52, "y": 40, "scale": 0.5, "rotation": 0 },
    "panda": { "x": 52, "y": 40, "scale": 0.5, "rotation": 0 },
    "owl": { "x": 52, "y": 40, "scale": 0.5, "rotation": 0 },
    "beaver": { "x": 52, "y": 40, "scale": 0.5, "rotation": 0 },
    "elephant": { "x": 52, "y": 40, "scale": 0.5, "rotation": 0 },
    "otter": { "x": 52, "y": 40, "scale": 0.5, "rotation": 0 },
    "parrot": { "x": 52, "y": 40, "scale": 0.5, "rotation": 0 },
    "border-collie": { "x": 52, "y": 40, "scale": 0.5, "rotation": 0 }
  }
};

export default function BulkPositionUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);
  const [customPositions, setCustomPositions] = useState(JSON.stringify(positions, null, 2));

  const updateAllPositions = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No auth token found. Please log in as a teacher first.');
      return;
    }

    setIsUpdating(true);
    setUpdateStatus('idle');

    try {
      // Parse the positions from the textarea
      const positionsToUpdate = JSON.parse(customPositions);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Loop through all items
      for (const [itemId, animalPositions] of Object.entries(positionsToUpdate)) {
        // Loop through all animals for this item
        for (const [animalType, position] of Object.entries(animalPositions as any)) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                item_id: itemId,
                animal_type: animalType,
                position_x: position.x,
                position_y: position.y,
                scale: Math.round(position.scale * 100), // Convert to percentage
                rotation: position.rotation
              })
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
              const error = await response.text();
              errors.push(`${itemId} on ${animalType}: ${error}`);
            }
          } catch (error: any) {
            errorCount++;
            errors.push(`${itemId} on ${animalType}: ${error.message}`);
          }

          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setResults({ successCount, errorCount, errors });
      setUpdateStatus(errorCount === 0 ? 'success' : 'error');
    } catch (error: any) {
      setResults({ error: error.message });
      setUpdateStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const verifyPositions = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/item-positions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const savedPositions = await response.json();
      alert(`Total positions in database: ${savedPositions.length}`);
      console.log('Saved positions:', savedPositions);
    } catch (error) {
      console.error('Failed to verify positions:', error);
      alert('Failed to verify positions. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Bulk Position Update</CardTitle>
            <p className="text-muted-foreground">
              Update all item positions at once
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Position Data */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Position Data (JSON)
              </label>
              <Textarea
                value={customPositions}
                onChange={(e) => setCustomPositions(e.target.value)}
                className="font-mono text-xs h-96"
                placeholder="Paste your position data here..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Edit the JSON above to customize positions before updating
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={updateAllPositions}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Positions...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Update All Positions
                  </>
                )}
              </Button>

              <Button
                onClick={verifyPositions}
                variant="outline"
              >
                Verify Saved Positions
              </Button>
            </div>

            {/* Results */}
            {results && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Update Results
                    {updateStatus === 'success' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    )}
                    {updateStatus === 'error' && (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Some Errors
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.successCount !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Successful Updates:</span>
                        <span className="font-bold text-green-600">
                          {results.successCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed Updates:</span>
                        <span className="font-bold text-red-600">
                          {results.errorCount}
                        </span>
                      </div>
                      
                      {results.errors && results.errors.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Errors:</h4>
                          <div className="bg-red-50 p-3 rounded text-sm">
                            {results.errors.map((error: string, index: number) => (
                              <div key={index} className="text-red-700">
                                • {error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {results.error && (
                    <div className="text-red-600">
                      Error: {results.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. The position data above contains all item positions for each animal</p>
                <p>2. You can edit the JSON directly to adjust any positions</p>
                <p>3. Click "Update All Positions" to save everything to the database</p>
                <p>4. Use "Verify Saved Positions" to check what's currently stored</p>
                <p className="font-semibold mt-4">
                  This will update {Object.keys(positions).length} items × 8 animals = {Object.keys(positions).length * 8} positions total
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
