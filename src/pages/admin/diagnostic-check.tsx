import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react';

export default function DiagnosticCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsChecking(true);
    setResults(null);
    
    const diagnostics: any = {
      auth: { status: 'checking', message: '' },
      adminStatus: { status: 'checking', message: '' },
      apiConnection: { status: 'checking', message: '' },
      itemPositionsTable: { status: 'checking', message: '' },
      testPost: { status: 'checking', message: '' }
    };

    try {
      // 1. Check auth token
      const token = localStorage.getItem('authToken');
      if (token) {
        diagnostics.auth = { status: 'success', message: 'Auth token found' };
        
        // Decode token to check admin status
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          diagnostics.auth.userId = payload.userId;
        } catch (e) {
          diagnostics.auth.message += ' (could not decode)';
        }
      } else {
        diagnostics.auth = { status: 'error', message: 'No auth token found' };
      }

      // 2. Check API connection
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${apiUrl}/api/health`);
        if (response.ok) {
          diagnostics.apiConnection = { 
            status: 'success', 
            message: `Connected to API at ${apiUrl}` 
          };
        } else {
          diagnostics.apiConnection = { 
            status: 'error', 
            message: `API returned ${response.status}` 
          };
        }
      } catch (error: any) {
        diagnostics.apiConnection = { 
          status: 'error', 
          message: `Cannot connect to API: ${error.message}` 
        };
      }

      // 3. Check if we can GET item positions (tests auth and table)
      if (token) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
          const response = await fetch(`${apiUrl}/api/admin/item-positions`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            diagnostics.itemPositionsTable = { 
              status: 'success', 
              message: `Table exists, ${data.length} positions found` 
            };
            diagnostics.adminStatus = { 
              status: 'success', 
              message: 'Admin access confirmed' 
            };
          } else {
            const errorText = await response.text();
            let errorMessage;
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorText;
            } catch {
              errorMessage = errorText;
            }
            
            if (response.status === 403) {
              diagnostics.adminStatus = { 
                status: 'error', 
                message: 'Not an admin user' 
              };
              diagnostics.itemPositionsTable = { 
                status: 'unknown', 
                message: 'Cannot check - no admin access' 
              };
            } else {
              diagnostics.itemPositionsTable = { 
                status: 'error', 
                message: `Error: ${errorMessage}` 
              };
            }
          }
        } catch (error: any) {
          diagnostics.itemPositionsTable = { 
            status: 'error', 
            message: `Request failed: ${error.message}` 
          };
        }
      }

      // 4. Test POST to item positions
      if (token && diagnostics.adminStatus.status === 'success') {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
          const response = await fetch(`${apiUrl}/api/admin/item-positions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              item_id: 'test_item',
              animal_type: 'test_animal',
              position_x: 50,
              position_y: 50,
              scale: 100,
              rotation: 0
            })
          });
          
          if (response.ok) {
            diagnostics.testPost = { 
              status: 'success', 
              message: 'Successfully saved test position' 
            };
          } else {
            const errorText = await response.text();
            diagnostics.testPost = { 
              status: 'error', 
              message: `POST failed: ${errorText}` 
            };
          }
        } catch (error: any) {
          diagnostics.testPost = { 
            status: 'error', 
            message: `POST request failed: ${error.message}` 
          };
        }
      }

    } catch (error: any) {
      console.error('Diagnostic error:', error);
    }

    setResults(diagnostics);
    setIsChecking(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              Item Positions Diagnostic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This will check why the item positions API isn't working.
            </p>

            <Button
              onClick={runDiagnostics}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                'Run Diagnostic Check'
              )}
            </Button>

            {results && (
              <div className="space-y-3 mt-6">
                {Object.entries(results).map(([key, result]: [string, any]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <h4 className="font-semibold capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-sm mt-1">{result.message}</p>
                        {result.userId && (
                          <p className="text-xs text-gray-500 mt-1">
                            User ID: {result.userId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Next Steps:</h4>
                {results.itemPositionsTable?.status === 'error' && 
                 results.itemPositionsTable.message.includes('relation') && (
                  <div className="text-sm space-y-2">
                    <p>The item_positions table doesn't exist. Run this SQL in Supabase:</p>
                    <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS item_animal_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id VARCHAR(50) NOT NULL,
    animal_type VARCHAR(20) NOT NULL,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    scale INTEGER DEFAULT 100,
    rotation INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(item_id, animal_type)
);`}
                    </pre>
                  </div>
                )}
                
                {results.adminStatus?.status === 'error' && (
                  <p className="text-sm">
                    You need admin access. Run this SQL in Supabase:
                    <pre className="bg-white p-2 rounded text-xs mt-1">
                      UPDATE users SET is_admin = true WHERE id = {results.auth?.userId || 'YOUR_USER_ID'};
                    </pre>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
