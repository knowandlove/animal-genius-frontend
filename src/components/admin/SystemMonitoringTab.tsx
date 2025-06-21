import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Cloud, 
  Database, 
  HardDrive, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  AlertCircle,
  DollarSign,
  Trash2,
  Image
} from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface SystemHealth {
  timestamp: string;
  status: 'healthy' | 'warning' | 'error';
  storage: {
    totalFiles: number;
    totalSize: number;
    byBucket: Record<string, { count: number; size: number }>;
    byType: Record<string, { count: number; size: number }>;
    cloudEnabled: boolean;
  };
  bandwidth: {
    monthly: Array<{
      month: string;
      total_gb: number;
      total_requests: number;
      estimated_cost: number;
    }>;
    trackingEnabled: boolean;
  };
  cleanup: {
    total_queued: number;
    ready_for_cleanup: number;
    overdue_items: number;
    oldest_item_date?: string;
  };
  database: {
    connections: number;
    indexes: {
      usage: Array<{
        tablename: string;
        indexname: string;
        index_scans: number;
      }>;
      potentiallyMissing: Array<{
        tablename: string;
        seq_scan: number;
        seq_scan_percentage: number;
      }>;
    };
  };
  recommendations: string[];
}

interface StorageAlert {
  type: 'bandwidth' | 'cleanup' | 'storage';
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  date: string;
  metadata?: any;
}

export function SystemMonitoringTab() {
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ["/api/admin/system-health"],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<{ alerts: StorageAlert[], summary: any }>({
    queryKey: ["/api/admin/storage-alerts"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCost = (cost: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cost);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'HIGH': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'MEDIUM': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
  };

  if (healthLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Health Monitoring</h2>
          <p className="text-muted-foreground">Cloud storage, bandwidth, and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchHealth()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh-health"
            />
            <Label htmlFor="auto-refresh-health">Auto-refresh</Label>
          </div>
        </div>
      </div>

      {/* System Status */}
      <Card className={cn(
        "border-2",
        health?.status === 'healthy' && "border-green-500",
        health?.status === 'warning' && "border-yellow-500",
        health?.status === 'error' && "border-red-500"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className={cn("h-5 w-5", getStatusColor(health?.status || 'healthy'))} />
            System Status: <span className={getStatusColor(health?.status || 'healthy')}>
              {health?.status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </CardTitle>
          <CardDescription>
            Last checked: {health ? new Date(health.timestamp).toLocaleString() : 'Never'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Active Alerts */}
      {alerts && alerts.alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-2">Active Alerts</h3>
          {alerts.alerts.map((alert, index) => (
            <Alert key={index} className={cn(
              "border-2",
              alert.level === 'HIGH' && "border-red-500 bg-red-50",
              alert.level === 'MEDIUM' && "border-yellow-500 bg-yellow-50"
            )}>
              <div className="flex items-start gap-2">
                {getAlertIcon(alert.level)}
                <div className="flex-1">
                  <AlertTitle>{alert.type.toUpperCase()} Alert</AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </div>
                <Badge variant={alert.level === 'HIGH' ? 'destructive' : 'secondary'}>
                  {alert.level}
                </Badge>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cloud Storage</CardTitle>
            <Cloud className={cn("h-4 w-4", health?.storage.cloudEnabled ? "text-green-600" : "text-gray-400")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.storage.cloudEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <p className="text-xs text-muted-foreground">
              {health?.storage.totalFiles || 0} files stored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(health?.storage.totalSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all buckets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cleanup Queue</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.cleanup.total_queued || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {health?.cleanup.overdue_items || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.database.connections || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active connections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Storage by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {health?.storage.byType && Object.entries(health.storage.byType).map(([type, data]) => (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{type}</span>
                  <span className="text-muted-foreground">
                    {data.count} files • {formatBytes(data.size)}
                  </span>
                </div>
                <Progress 
                  value={(data.size / health.storage.totalSize) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Bandwidth Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health?.bandwidth.trackingEnabled ? (
              <div className="space-y-3">
                {health.bandwidth.monthly.slice(0, 3).map((month) => (
                  <div key={month.month} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{month.month}</p>
                      <p className="text-sm text-muted-foreground">
                        {month.total_gb} GB • {month.total_requests.toLocaleString()} requests
                      </p>
                    </div>
                    <Badge variant={month.estimated_cost > 10 ? 'destructive' : 'secondary'}>
                      {formatCost(month.estimated_cost)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bandwidth tracking not yet enabled. Set up Supabase webhooks to track usage.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Issues */}
      {health?.database.indexes.potentiallyMissing && health.database.indexes.potentiallyMissing.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Zap className="h-4 w-4" />
              Performance Optimization Needed
            </CardTitle>
            <CardDescription>
              Tables with high sequential scan rates may need indexes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.database.indexes.potentiallyMissing.map((table) => (
                <div key={table.tablename} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span className="font-mono text-sm">{table.tablename}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-700">
                      {table.seq_scan_percentage}% seq scans
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {table.seq_scan.toLocaleString()} scans
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {health?.recommendations && health.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              System Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {health.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
