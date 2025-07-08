import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Server,
  AlertCircle,
  BarChart,
  TrendingUp,
  RefreshCw,
  Zap,
  Database
} from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Component to fetch and display HTTP metrics
function HttpMetricsDebug() {
  const { data: httpMetrics, isLoading } = useQuery({
    queryKey: ['/api/admin/metrics/http'],
    queryFn: () => apiRequest('GET', '/api/admin/metrics/http'),
  });

  if (isLoading) return <LoadingSpinner />;
  
  return (
    <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
      {JSON.stringify(httpMetrics, null, 2)}
    </pre>
  );
}

export function EnhancedMonitoringTab() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch quick stats (includes performance metrics now)
  const { data: quickStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/quick-stats'],
    queryFn: () => apiRequest('GET', '/api/admin/quick-stats'),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch error summary
  const { data: errorSummary, isLoading: errorsLoading } = useQuery({
    queryKey: ['/api/admin/errors/summary'],
    queryFn: () => apiRequest('GET', '/api/admin/errors/summary'),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch health status
  const { data: healthStatus, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/health/ready'],
    queryFn: () => apiRequest('GET', '/api/health/ready'),
    refetchInterval: autoRefresh ? 15000 : false,
  });

  if (statsLoading || errorsLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const performance = quickStats?.performance || {};
  const alerts = quickStats?.alerts || [];
  const errors = errorSummary || {};
  const health = healthStatus || {};
  
  // Check if we have API access
  const hasApiAccess = !(!quickStats && !errorSummary && !healthStatus);

  return (
    <div className="space-y-6">
      {/* Auto-refresh toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Monitoring</h2>
        <div className="flex items-center gap-2">
          <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
          <label htmlFor="auto-refresh" className="text-sm font-medium">
            Auto-refresh
          </label>
          <input
            id="auto-refresh"
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
      </div>

      {/* API Endpoints Info */}
      <Alert className="border-blue-500 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle>API Endpoints</AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-1 text-sm">
            <p>The monitoring data is fetched from these backend endpoints:</p>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              <li>• Quick Stats: <code>http://localhost:5001/api/admin/quick-stats</code></li>
              <li>• Error Summary: <code>http://localhost:5001/api/admin/errors/summary</code></li>
              <li>• Health Check: <code>http://localhost:5001/api/health/ready</code></li>
              <li>• HTTP Metrics: <code>http://localhost:5001/api/admin/metrics/http</code></li>
            </ul>
            <p className="mt-2">These require authentication and are automatically fetched with your admin credentials.</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              {health.status === 'healthy' ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : health.status === 'degraded' ? (
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Overall Status</p>
                <p className="text-lg font-semibold capitalize">{health.status || 'Unknown'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-lg font-semibold">{performance.uptime ? `${performance.uptime} min` : 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">DB Response</p>
                <p className="text-lg font-semibold">{health.checks?.database?.responseTime ? `${health.checks.database.responseTime}ms` : 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Alerts</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {alerts.map((alert: any, index: number) => (
                <li key={index}>{alert.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.errorRate?.toFixed(2) || '0.00'}
              <span className="text-sm font-normal text-muted-foreground">/min</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {performance.errorsToday || 0} errors today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.avgResponseTime || 0}
              <span className="text-sm font-normal text-muted-foreground">ms</span>
            </div>
            <Progress 
              value={Math.min((performance.avgResponseTime || 0) / 10, 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health.details?.memory?.heapUsed ? Math.round(health.details.memory.heapUsed) : 0}
              <span className="text-sm font-normal text-muted-foreground">MB</span>
            </div>
            <Progress 
              value={health.details?.memory?.heapUsed ? (health.details.memory.heapUsed / health.details.memory.heapTotal) * 100 : 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quickStats?.engagement?.dailyActiveUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {quickStats?.engagement?.weeklyActiveUsers || 0} this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Details */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">Recent Errors</TabsTrigger>
          <TabsTrigger value="top">Top Errors</TabsTrigger>
          <TabsTrigger value="slowest">Slowest Endpoints</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Last 5 errors across the system</CardDescription>
            </CardHeader>
            <CardContent>
              {quickStats?.recentErrors?.length > 0 ? (
                <div className="space-y-3">
                  {quickStats.recentErrors.map((error: any, index: number) => (
                    <div key={index} className="flex items-start justify-between text-sm">
                      <div className="flex-1">
                        <Badge variant="destructive" className="mr-2">{error.code}</Badge>
                        <span className="text-muted-foreground">{error.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent errors</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle>Top Error Codes</CardTitle>
              <CardDescription>Most frequent errors</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.topErrors?.length > 0 ? (
                <div className="space-y-3">
                  {errors.topErrors.map((error: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{error.code}</Badge>
                        <span className="text-sm">{error.message}</span>
                      </div>
                      <span className="text-sm font-semibold">{error.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No error data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="slowest">
          <Card>
            <CardHeader>
              <CardTitle>Slowest Endpoints</CardTitle>
              <CardDescription>Endpoints with highest response times</CardDescription>
            </CardHeader>
            <CardContent>
              {performance.slowestEndpoints?.length > 0 ? (
                <div className="space-y-3">
                  {performance.slowestEndpoints.map((endpoint: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-mono">{endpoint.path}</span>
                      <Badge variant={endpoint.duration > 1000 ? "destructive" : "secondary"}>
                        {endpoint.duration}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No slow endpoints detected</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Raw API Data */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>View raw API responses for debugging</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quickstats" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quickstats">Quick Stats</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="http">HTTP Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quickstats" className="mt-4">
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                {JSON.stringify(quickStats, null, 2)}
              </pre>
            </TabsContent>
            
            <TabsContent value="errors" className="mt-4">
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                {JSON.stringify(errorSummary, null, 2)}
              </pre>
            </TabsContent>
            
            <TabsContent value="health" className="mt-4">
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </TabsContent>
            
            <TabsContent value="http" className="mt-4">
              <HttpMetricsDebug />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}