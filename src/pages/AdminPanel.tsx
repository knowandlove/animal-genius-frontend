import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Users, School, BarChart3, Shield, Trash2, Key, Edit, Eye, Activity, Clock, Database, Wifi, Palette, Package, Sparkles, Monitor, Home, Dog, AlertCircle, MessageSquare } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SystemMonitoringTab } from "@/components/admin/SystemMonitoringTab";
import { AdminDashboardSummary } from "@/components/admin/AdminDashboardSummary";
import { EnhancedMonitoringTab } from "@/components/admin/EnhancedMonitoringTab";
import { AdminFeedbackDashboard } from "@/components/admin/AdminFeedbackDashboard";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolOrganization: string;
  roleTitle: string;
  isAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  classCount: number;
  submissionCount: number;
}

interface ClassRecord {
  id: number;
  name: string;
  description: string;
  code: string;
  teacherName: string;
  submissionCount: number;
  createdAt: string;
}

interface AdminStats {
  totalTeachers: number;
  totalClasses: number;
  totalSubmissions: number;
  recentSignups: number;
  topSchools: { school: string; count: number }[];
  animalDistribution: Record<string, number>;
}

interface PerformanceMetrics {
  timestamp: string;
  connections: {
    totalConnections: number;
    activeConnections: number;
    teacherConnections: number;
    playerConnections: number;
    connectionsPeakToday: number;
  };
  messages: {
    totalMessages: number;
    messagesPerSecond: number;
    errorCount: number;
    errorRate: number;
  };
  games: {
    activeGames: number;
    totalGamesCreated: number;
    totalPlayersJoined: number;
    averagePlayersPerGame: number;
    averageGameDuration: number;
    gamesCompletedToday: number;
    peakActiveGames: number;
  };
  database: {
    queryCount: number;
    averageQueryTime: number;
    slowQueries: Array<{ query: string; duration: number; timestamp: string }>;
    failedQueries: number;
  };
  system: {
    memoryUsage: number;
    uptime: number;
  };
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [editingSchool, setEditingSchool] = useState<{ teacherId: number; currentSchool: string } | null>(null);
  const [newSchoolName, setNewSchoolName] = useState("");

  // Fetch admin data
  const { data: teachers, isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/admin/teachers"],
  });

  const { data: classes, isLoading: classesLoading } = useQuery<ClassRecord[]>({
    queryKey: ["/api/admin/classes"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Mutations
  const updateAdminStatus = useMutation({
    mutationFn: async ({ teacherId, isAdmin }: { teacherId: number; isAdmin: boolean }) => {
      return apiRequest("PUT", `/api/admin/teachers/${teacherId}/admin`, { isAdmin });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (teacherId: number) => {
      return apiRequest("POST", `/api/admin/teachers/${teacherId}/reset-password`);
    },
    onSuccess: async (data) => {
      toast({
        title: "Password Reset",
        description: `New password: ${data.newPassword}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const updateSchool = useMutation({
    mutationFn: async ({ teacherId, schoolName }: { teacherId: number; schoolName: string }) => {
      return apiRequest("PUT", `/api/admin/teachers/${teacherId}/school`, { schoolName });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      setEditingSchool(null);
      setNewSchoolName("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update school",
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (teacherId: number) => {
      return apiRequest("DELETE", `/api/admin/teachers/${teacherId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleSchoolEdit = (teacherId: number, currentSchool: string) => {
    setEditingSchool({ teacherId, currentSchool });
    setNewSchoolName(currentSchool);
  };

  const handleSchoolUpdate = () => {
    if (editingSchool && newSchoolName.trim()) {
      updateSchool.mutate({
        teacherId: editingSchool.teacherId,
        schoolName: newSchoolName.trim(),
      });
    }
  };

  if (teachersLoading || classesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Admin Panel</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubmissions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentSignups || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="monitoring">Health</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="avatar-tools">Store Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AdminDashboardSummary />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <EnhancedMonitoringTab />
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Management</CardTitle>
              <CardDescription>
                Manage teacher accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers?.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {teacher.firstName} {teacher.lastName}
                        </h3>
                        {teacher.isAdmin && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{teacher.schoolOrganization}</span>
                        <span>•</span>
                        <span>{teacher.classCount} classes</span>
                        <span>•</span>
                        <span>{teacher.submissionCount} submissions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={teacher.isAdmin}
                          onCheckedChange={(checked) =>
                            updateAdminStatus.mutate({
                              teacherId: teacher.id,
                              isAdmin: checked,
                            })
                          }
                          disabled={updateAdminStatus.isPending}
                        />
                        <Label htmlFor="admin-status" className="text-sm">
                          Admin
                        </Label>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSchoolEdit(teacher.id, teacher.schoolOrganization)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetPassword.mutate(teacher.id)}
                        disabled={resetPassword.isPending}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {teacher.firstName} {teacher.lastName}'s account and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser.mutate(teacher.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Management</CardTitle>
              <CardDescription>
                View all classes across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classes?.map((classRecord) => (
                  <div key={classRecord.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{classRecord.name}</h3>
                      <p className="text-sm text-muted-foreground">{classRecord.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Code: {classRecord.code}</span>
                        <span>•</span>
                        <span>Teacher: {classRecord.teacherName}</span>
                        <span>•</span>
                        <span>{classRecord.submissionCount} submissions</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(classRecord.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Schools</CardTitle>
                <CardDescription>
                  Schools with the most teachers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.topSchools?.map((school, index) => (
                    <div key={school.school} className="flex justify-between items-center">
                      <span className="text-sm">{school.school}</span>
                      <Badge variant="outline">{school.count} teachers</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Animal Distribution</CardTitle>
                <CardDescription>
                  Most common personality animals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.animalDistribution && Object.entries(stats.animalDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([animal, count]) => (
                      <div key={animal} className="flex justify-between items-center">
                        <span className="text-sm">{animal}</span>
                        <Badge variant="outline">{count} students</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="avatar-tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Store & Avatar Management
              </CardTitle>
              <CardDescription>
                Unified tools for managing the store and avatar customization system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main Tools */}
                <Card className="border-2 border-green-500 hover:border-green-600 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Store Management
                      <Badge className="bg-green-100 text-green-800">Primary</Badge>
                    </CardTitle>
                    <CardDescription>
                      Add, edit, and manage all store items
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setLocation("/admin/store")}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Open Store Manager
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-500 hover:border-purple-600 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Dog className="h-4 w-4" />
                      Pet Management
                      <Badge className="bg-purple-100 text-purple-800">New</Badge>
                    </CardTitle>
                    <CardDescription>
                      Manage pet types, sprites, and behaviors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setLocation("/admin/pets")}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Open Pet Manager
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-orange-500 hover:border-orange-600 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Lesson Feedback
                      <Badge className="bg-orange-100 text-orange-800">Analytics</Badge>
                    </CardTitle>
                    <CardDescription>
                      View and analyze teacher feedback on lessons
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setLocation("/admin/feedback")}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      Open Feedback Dashboard
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-500 hover:border-blue-600 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Avatar Positioning Suite
                      <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                    </CardTitle>
                    <CardDescription>
                      Position items on animals & manage sizes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setLocation("/admin/item-positioner-normalized")}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Open Positioning Tools
                    </Button>
                  </CardContent>
                </Card>

                {/* Utility Tools */}
                <Card className="border hover:border-gray-400 transition-colors opacity-75">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Animal Sizer
                      <Badge variant="secondary">Utility</Badge>
                    </CardTitle>
                    <CardDescription>
                      Fine-tune animal graphic sizes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setLocation("/admin/animal-sizer")}
                      variant="outline"
                      className="w-full"
                    >
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border hover:border-gray-400 transition-colors opacity-75">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Bulk Operations
                      <Badge variant="secondary">Utility</Badge>
                    </CardTitle>
                    <CardDescription>
                      Batch update positions and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setLocation("/admin/bulk-update")}
                      variant="outline"
                      className="w-full"
                    >
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Start Guide */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-600" />
                  Quick Start Guide
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-2">🛍️ Setting up the Store:</p>
                    <ol className="space-y-1 list-decimal list-inside ml-2">
                      <li>Open <strong>Store Management</strong></li>
                      <li>Add items with images and prices</li>
                      <li>Toggle items active/inactive as needed</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-medium mb-2">🎯 Positioning Items:</p>
                    <ol className="space-y-1 list-decimal list-inside ml-2">
                      <li>Open <strong>Avatar Positioning Suite</strong></li>
                      <li>Select an item and animal</li>
                      <li>Drag to position or use sliders</li>
                      <li>Use "Copy to All" for universal items</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Deprecation Notice */}
              <Alert className="mt-4 border-orange-200 bg-orange-50">
                <AlertDescription className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <span>
                    <strong>Note:</strong> The old "Add Store Item" tool has been deprecated. 
                    Please use the new Store Management system which saves directly to the database.
                  </span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <AdminFeedbackDashboard />
        </TabsContent>
      </Tabs>

      {/* School Edit Dialog */}
      <Dialog open={!!editingSchool} onOpenChange={() => setEditingSchool(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
            <DialogDescription>
              Update the school organization for this teacher
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="school-name">School Name</Label>
              <Input
                id="school-name"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="Enter school name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSchool(null)}>
              Cancel
            </Button>
            <Button onClick={handleSchoolUpdate} disabled={updateSchool.isPending}>
              Update School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}