import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp,
  Users,
  School,
  DollarSign,
  Package,
  ShoppingCart,
  UserCheck,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/lib/utils";

interface QuickStats {
  teachers: {
    total: number;
    activeToday: number;
    newThisWeek: number;
    trend: 'up' | 'down' | 'stable';
  };
  students: {
    total: number;
    quizzesCompleted: number;
    averageCoins: number;
    mostCommonAnimal: string;
  };
  store: {
    totalItems: number;
    activeItems: number;
    pendingOrders: number;
    popularItems: Array<{ name: string; purchases: number }>;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    averageSessionTime: string;
    peakHours: Array<{ hour: number; count: number }>;
  };
}

export function AdminDashboardSummary() {
  const { data: stats, isLoading } = useQuery<QuickStats>({
    queryKey: ["/api/admin/quick-stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-auto flex flex-col items-center gap-2 p-4"
          onClick={() => window.location.href = '/admin/store'}
        >
          <Package className="h-6 w-6" />
          <span>Manage Store</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto flex flex-col items-center gap-2 p-4"
          onClick={() => window.location.href = '/dashboard'}
        >
          <Users className="h-6 w-6" />
          <span>View Classes</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto flex flex-col items-center gap-2 p-4"
          onClick={() => window.location.href = '/admin/item-positioner'}
        >
          <UserCheck className="h-6 w-6" />
          <span>Avatar Tools</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto flex flex-col items-center gap-2 p-4"
          onClick={() => window.location.href = '/create-class'}
        >
          <School className="h-6 w-6" />
          <span>Create Class</span>
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {stats && getTrendIcon(stats.teachers.trend)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.teachers.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.teachers.activeToday || 0} active today
            </p>
            <p className="text-xs text-green-600">
              +{stats?.teachers.newThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.students.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.students.quizzesCompleted || 0} quizzes completed
            </p>
            <p className="text-xs text-blue-600">
              Most common: {stats?.students.mostCommonAnimal || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Activity</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.store.activeItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              active items of {stats?.store.totalItems || 0} total
            </p>
            <p className="text-xs text-orange-600">
              {stats?.store.pendingOrders || 0} pending orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Coins/Student</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.students.averageCoins || 0}</div>
            <p className="text-xs text-muted-foreground">
              across all students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              User Engagement
            </CardTitle>
            <CardDescription>
              Platform activity metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Daily Active</p>
                <p className="text-2xl font-bold">{stats?.engagement.dailyActiveUsers || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Weekly Active</p>
                <p className="text-2xl font-bold">{stats?.engagement.weeklyActiveUsers || 0}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Peak Activity Hours</p>
              <div className="flex gap-2">
                {stats?.engagement.peakHours.slice(0, 3).map(hour => (
                  <Badge key={hour.hour} variant="secondary">
                    {hour.hour}:00 - {hour.count} users
                  </Badge>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Average session: {stats?.engagement.averageSessionTime || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Popular Store Items
            </CardTitle>
            <CardDescription>
              Most purchased items this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.store.popularItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {item.purchases} purchases
                  </Badge>
                </div>
              ))}
              {(!stats?.store.popularItems || stats.store.popularItems.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No purchases yet this week
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{stats?.teachers.activeToday || 0}</p>
              <p className="text-sm text-blue-600">Teachers Active</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{stats?.students.quizzesCompleted || 0}</p>
              <p className="text-sm text-green-600">Quizzes Completed</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-700">{stats?.store.pendingOrders || 0}</p>
              <p className="text-sm text-orange-600">Pending Orders</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-700">
                {stats?.engagement.dailyActiveUsers || 0}
              </p>
              <p className="text-sm text-purple-600">Total Active Users</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
