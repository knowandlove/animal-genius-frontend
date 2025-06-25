import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Database, HardDrive, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface PerformanceStats {
  fps: number;
  memory: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  renderTime: number;
  componentCount: number;
}

interface SystemHealth {
  status: string;
  storage: {
    totalFiles: number;
    totalSize: number;
    cloudEnabled: boolean;
  };
  database: {
    connections: number;
  };
  timestamp: string;
}

export function PerformanceMonitor({ onClose }: { onClose?: () => void }) {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    memory: {},
    renderTime: 0,
    componentCount: 0
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // FPS Counter
  useEffect(() => {
    let animationId: number;
    
    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTimeRef.current + 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
        
        setStats(prev => ({ ...prev, fps }));
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Memory Usage (if available)
  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setStats(prev => ({
          ...prev,
          memory: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          }
        }));
      }
    };

    const interval = setInterval(updateMemory, 2000);
    updateMemory();
    
    return () => clearInterval(interval);
  }, []);

  // Component Count
  useEffect(() => {
    const countComponents = () => {
      const count = document.querySelectorAll('[data-react-component]').length || 
                   document.querySelectorAll('[class*="absolute"]').length; // Rough estimate
      setStats(prev => ({ ...prev, componentCount: count }));
    };

    const interval = setInterval(countComponents, 2000);
    countComponents();
    
    return () => clearInterval(interval);
  }, []);

  // Render Time
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && 'duration' in lastEntry) {
        setStats(prev => ({ ...prev, renderTime: Math.round(lastEntry.duration) }));
      }
    });

    try {
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (e) {
      // Some browsers don't support all entry types
    }

    return () => observer.disconnect();
  }, []);

  // Fetch system health (admin only)
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const health = await apiRequest<SystemHealth>('GET', '/api/admin/system-health');
        setSystemHealth(health);
      } catch (error) {
        // User might not be admin, that's okay
        console.log('Could not fetch system health (admin only)');
      }
    };

    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes?: number): string => {
    if (!bytes) return '0 MB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 50) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="shadow-lg"
        >
          <Activity className="w-4 h-4 mr-2" />
          {stats.fps} FPS
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance Monitor
          </h3>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsMinimized(true)}
            >
              <span className="text-xs">_</span>
            </Button>
            {onClose && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Frontend Performance */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Frontend Performance</div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Zap className={cn("w-3 h-3", getFPSColor(stats.fps))} />
              <span>FPS:</span>
              <span className={cn("font-mono", getFPSColor(stats.fps))}>
                {stats.fps}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-blue-600" />
              <span>Render:</span>
              <span className="font-mono">{stats.renderTime}ms</span>
            </div>
          </div>

          {stats.memory.usedJSHeapSize && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Memory Usage:</span>
                <span className="font-mono">
                  {formatBytes(stats.memory.usedJSHeapSize)} / {formatBytes(stats.memory.jsHeapSizeLimit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(stats.memory.usedJSHeapSize! / stats.memory.jsHeapSizeLimit!) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span>DOM Elements:</span>
            <span className="font-mono">{stats.componentCount}</span>
          </div>
        </div>

        {/* System Health (if admin) */}
        {systemHealth && (
          <>
            <div className="border-t pt-2">
              <div className="text-sm font-medium text-muted-foreground">System Health</div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-green-600" />
                  <span>DB Conns:</span>
                  <span className="font-mono">{systemHealth.database.connections}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3 h-3 text-purple-600" />
                  <span>Storage:</span>
                  <span className="font-mono">
                    {systemHealth.storage.cloudEnabled ? 'Cloud' : 'Local'}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                {systemHealth.storage.totalFiles} files • {formatBytes(systemHealth.storage.totalSize)}
              </div>
            </div>
          </>
        )}

        {/* Performance Tips */}
        <div className="border-t pt-2">
          <div className="text-xs text-muted-foreground">
            {stats.fps < 30 && "⚠️ Low FPS detected - reduce items in room"}
            {stats.memory.usedJSHeapSize && stats.memory.usedJSHeapSize > 50 * 1048576 && 
              "⚠️ High memory usage - refresh page"}
            {stats.componentCount > 200 && "⚠️ Many DOM elements - consider removing items"}
          </div>
        </div>
      </div>
    </Card>
  );
}
