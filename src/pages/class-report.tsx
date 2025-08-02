import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Users, UserCheck, Clock, AlertCircle, Heart, Brain, Zap, Monitor } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";

export default function ClassReport() {
  const [, params] = useRoute("/class-report/:classId");
  const classId = params?.classId;
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  
  // Debug logging
  useEffect(() => {
    console.log('ClassReport component mounted');
    console.log('ClassReport - Route params:', params);
    console.log('ClassReport - Class ID:', classId);
    console.log('Current location:', window.location.pathname);
  }, [params, classId]);

  // Fetch real analytics data - MOVED BEFORE conditional logic
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: [`/api/classes/${classId}/analytics`],
    enabled: !!classId && !!localStorage.getItem("authToken") && !authLoading && !!user
  });

  // Fetch real pairings data - MOVED BEFORE conditional logic
  const { data: pairings, isLoading: pairingsLoading, error: pairingsError } = useQuery({
    queryKey: [`/api/classes/${classId}/pairings`],
    enabled: !!classId && !!localStorage.getItem("authToken") && !authLoading && !!user,
    refetchInterval: (data) => {
      // If pairings are still processing, refetch every 3 seconds
      if (data?.status === 'processing') {
        return 3000;
      }
      return false; // Stop refetching once we have data
    }
  });
  
  console.log('ClassReport - Query states:', {
    analyticsLoading,
    analyticsError,
    hasAnalytics: !!analytics,
    pairingsLoading,
    pairingsError,
    hasPairings: !!pairings,
    pairingsData: pairings,
    isPairingsProcessing,
    totalStudents: analytics?.stats?.totalSubmissions
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authTokenChanged"));
    setLocation("/");
  };

  if (authLoading || !user) {
    console.log('ClassReport - Still loading or no user:', { authLoading, user });
    return <div>Loading...</div>;
  }
  
  console.log('ClassReport - Past auth check, rendering main content');

  // Helper function to navigate to student view
  const handleStudentClick = (submissionId: number) => {
    setLocation(`/teacher/student/${submissionId}?classId=${classId}&from=report`);
  };

  // Show loading state only for analytics (pairings can load in background)
  if (analyticsLoading) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        user={user}
        onLogout={handleLogout}
      >
        <div className="min-h-screen p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading class data...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Define proper types for API responses
  interface AnalyticsResponse {
    class: { name: string };
    stats: {
      totalSubmissions: number;
      geniusTypeDistribution: { Thinker: number; Feeler: number; Doer: number };
    };
    insights?: {
      mayGetOverlooked: Array<{ name: string; animal: string; submissionId: number }>;
      needConnection: Array<{ name: string; animal: string; submissionId: number }>;
      needChangeWarnings: Array<{ name: string; animal: string; submissionId: number }>;
      needThinkTime: Array<{ name: string; animal: string; submissionId: number }>;
    };
  }

  interface PairingsResponse {
    dynamicDuos: Array<{
      student1: { name: string; animal: string; submissionId: number };
      student2: { name: string; animal: string; submissionId: number };
      reason: string;
    }>;
    puzzlePairings: Array<{
      student1: { name: string; animal: string; submissionId: number };
      student2: { name: string; animal: string; submissionId: number };
      issue: string;
    }>;
    soloWorkers: Array<{ name: string; animal: string; submissionId: number; note: string }>;
  }

  // Calculate real data from API responses
  const typedAnalytics = analytics as AnalyticsResponse;
  // Check if pairings are still processing
  const isPairingsProcessing = pairings?.status === 'processing';
  const typedPairings = (!isPairingsProcessing ? pairings : null) as PairingsResponse;
  
  // Debug logging
  console.log('🔍 Class Report Debug:');
  console.log('   classId:', classId);
  console.log('   analyticsLoading:', analyticsLoading);
  console.log('   pairingsLoading:', pairingsLoading);
  console.log('   analytics:', analytics);
  console.log('   pairings:', pairings);
  console.log('   analyticsError:', analyticsError);
  console.log('   pairingsError:', pairingsError);
  console.log('   hasToken:', !!localStorage.getItem("authToken"));
  
  const classData = typedAnalytics?.class ? {
    name: typedAnalytics.class.name,
    totalStudents: typedAnalytics.stats?.totalSubmissions || 0,
    collaborationData: [
      { name: "Thinkers", value: typedAnalytics.stats?.geniusTypeDistribution?.Thinker || 0, color: "#8B5CF6" },
      { name: "Feelers", value: typedAnalytics.stats?.geniusTypeDistribution?.Feeler || 0, color: "#10B981" },
      { name: "Doers", value: typedAnalytics.stats?.geniusTypeDistribution?.Doer || 0, color: "#F59E0B" }
    ],
    dynamicDuos: typedPairings?.dynamicDuos?.map(duo => ({
      student1: `${duo.student1.name} (${duo.student1.animal})`,
      student2: `${duo.student2.name} (${duo.student2.animal})`,
      note: duo.reason || "Natural collaborators",
      submissionId1: duo.student1.submissionId,
      submissionId2: duo.student2.submissionId
    })) || [],
    puzzlePairings: typedPairings?.puzzlePairings?.map(pair => ({
      student1: `${pair.student1.name} (${pair.student1.animal})`,
      student2: `${pair.student2.name} (${pair.student2.animal})`,
      tip: pair.issue || "May need extra support",
      submissionId1: pair.student1.submissionId,
      submissionId2: pair.student2.submissionId
    })) || [],
    soloWorkers: typedPairings?.soloWorkers?.map(worker => ({
      name: `${worker.name} (${worker.animal})`,
      note: worker.note,
      submissionId: worker.submissionId
    })) || [],
    insights: {
      mayGetOverlooked: typedAnalytics?.insights?.mayGetOverlooked || [],
      needConnection: typedAnalytics?.insights?.needConnection || [],
      needChangeWarnings: typedAnalytics?.insights?.needChangeWarnings || [],
      needThinkTime: typedAnalytics?.insights?.needThinkTime || []
    }
  } : null;

  // Show error state with details
  if (analyticsError || pairingsError) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        user={user}
        onLogout={handleLogout}
      >
        <div className="min-h-screen p-4 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Class Data</h2>
            <p className="text-gray-600 mb-4">
              {analyticsError ? `Analytics: ${analyticsError.message}` : ''}
              {pairingsError ? `Pairings: ${pairingsError.message}` : ''}
            </p>
            <Button onClick={() => setLocation('/')} className="mt-4">Back to Dashboard</Button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!classData) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        user={user}
        onLogout={handleLogout}
      >
        <div className="min-h-screen p-4 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Class Data Available</h2>
            <p className="text-gray-600 mb-4">
              Analytics loaded: {analytics ? 'Yes' : 'No'}<br/>
              Analytics class: {(analytics as any)?.class ? 'Yes' : 'No'}<br/>
              Class ID: {classId}
            </p>
            <Button onClick={() => setLocation('/')} className="mt-4">Back to Dashboard</Button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const handleBackToAnalytics = () => {
    setLocation(`/class/${classId}/analytics`);
  };

  const handleCreateBalancedGroups = () => {
    setLocation(`/group-maker?classId=${classId}&from=report`);
  };

  const handleCreateSeatingChart = () => {
    setLocation(`/group-maker?classId=${classId}&from=report&mode=seating`);
  };

  return (
    <AuthenticatedLayout 
      showSidebar={true}
      classId={classId}
      className={classData?.name}
      user={user}
      onLogout={handleLogout}
    >
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading text-foreground">{classData.name}</h1>
                <p className="font-body text-muted-foreground">Class Report & Insights</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackToAnalytics}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Analytics
                </Button>
                <Button 
                  onClick={() => setLocation(`/classes/${classId}/live`)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Monitor className="h-4 w-4" />
                  Live Discovery Board
                </Button>
                <Button className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8">
          {/* Section 1: Collaboration Styles Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Brain className="h-5 w-5 text-purple-600" />
                Collaboration Styles Overview
              </CardTitle>
              <CardDescription>Distribution of thinking and working styles in your class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={classData.collaborationData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {classData.collaborationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <div>
                      <div className="font-semibold">Thinkers ({classData.collaborationData[0].value})</div>
                      <div className="text-sm text-muted-foreground">Analytical, logical problem-solvers</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                    <div className="w-4 h-4 bg-accent rounded"></div>
                    <div>
                      <div className="font-semibold">Feelers ({classData.collaborationData[1].value})</div>
                      <div className="text-sm text-muted-foreground">Empathetic, people-focused collaborators</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <div>
                      <div className="font-semibold">Doers ({classData.collaborationData[2].value})</div>
                      <div className="text-sm text-muted-foreground">Action-oriented, hands-on learners</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Section 2: Grouping Recommendations */}
          <Card>
            <CardContent className="p-4">
              <h2 className="text-2xl font-heading text-foreground flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                Grouping Recommendations
              </h2>
            </CardContent>
          </Card>
          
          <div className="grid gap-6">
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Suggested Balanced Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-subheading text-green-700">Suggested Balanced Groups</CardTitle>
                  <CardDescription>Create groups with balanced Thinker/Feeler/Doer mix</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Automatically generate groups that balance different collaboration styles for optimal team dynamics.
                  </p>
                  <Button onClick={handleCreateBalancedGroups} className="w-full">
                    Create Balanced Groups
                  </Button>
                </CardContent>
              </Card>

              {/* Prefers Solo Work */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-subheading text-purple-700">Prefers Solo Work</CardTitle>
                  <CardDescription>Students who excel in independent tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {isPairingsProcessing ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        <p className="text-sm">Analyzing student preferences...</p>
                      </div>
                    ) : classData.soloWorkers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No solo workers identified yet</p>
                    ) : (
                      classData.soloWorkers.map((student: any, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                          <UserCheck className="h-4 w-4 text-purple-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-sm">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.note}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Dynamic Duos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-subheading text-blue-700">Dynamic Duos</CardTitle>
                  <CardDescription>Natural collaborator pairings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {isPairingsProcessing ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm">Finding dynamic duos...</p>
                      </div>
                    ) : classData.dynamicDuos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No dynamic duos identified yet</p>
                    ) : (
                      classData.dynamicDuos.map((duo: any, index: number) => (
                        <div key={index} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <div className="font-medium text-sm mb-1">
                            {duo.student1} + {duo.student2}
                          </div>
                          <div className="text-xs text-blue-700">{duo.note}</div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Puzzle Pairings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-subheading text-orange-700">Puzzle Pairings</CardTitle>
                  <CardDescription>Pairings that may need extra support</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {isPairingsProcessing ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
                        <p className="text-sm">Analyzing pairing challenges...</p>
                      </div>
                    ) : classData.puzzlePairings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No challenging pairings identified yet</p>
                    ) : (
                      classData.puzzlePairings.map((pair: any, index: number) => (
                        <div key={index} className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                          <div className="font-medium text-sm mb-1">
                            {pair.student1} + {pair.student2}
                          </div>
                          <div className="text-xs text-orange-700">{pair.tip}</div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 3: Classroom Insights */}
          <Card>
            <CardContent className="p-4">
              <h2 className="text-2xl font-heading text-foreground flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-green-600" />
                Classroom Insights
              </h2>
            </CardContent>
          </Card>
          
          <div className="grid gap-6">
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* May Get Overlooked */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-subheading text-yellow-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    May Get Overlooked
                  </CardTitle>
                  <CardDescription className="text-xs">Quiet processors who may need encouragement</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {classData.insights.mayGetOverlooked.map((student: any, index: number) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs bg-yellow-50 border-yellow-200 cursor-pointer hover:bg-yellow-100"
                        onClick={() => handleStudentClick(student.submissionId)}
                      >
                        {student.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Need Connection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-subheading text-red-700 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Need Connection
                  </CardTitle>
                  <CardDescription className="text-xs">Perform best with strong teacher relationships</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {classData.insights.needConnection.map((student: any, index: number) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs bg-red-50 border-red-200 cursor-pointer hover:bg-red-100"
                        onClick={() => handleStudentClick(student.submissionId)}
                      >
                        {student.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Need Change Warnings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-subheading text-blue-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Need Change Warnings
                  </CardTitle>
                  <CardDescription className="text-xs">Need advance notice of schedule changes</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {classData.insights.needChangeWarnings.map((student: any, index: number) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100"
                        onClick={() => handleStudentClick(student.submissionId)}
                      >
                        {student.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Need Think Time */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-subheading text-purple-700 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Need Think Time
                  </CardTitle>
                  <CardDescription className="text-xs">Allow processing time before calling on them</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {classData.insights.needThinkTime.map((student: any, index: number) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs bg-purple-50 border-purple-200 cursor-pointer hover:bg-purple-100"
                        onClick={() => handleStudentClick(student.submissionId)}
                      >
                        {student.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 4: Suggested Seating Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Zap className="h-5 w-5 text-orange-600" />
                Suggested Seating Chart
              </CardTitle>
              <CardDescription>Optimize classroom layout for better collaboration and focus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Seating Chart Visualization Coming Soon</h3>
                <p className="text-gray-600 mb-6">
                  Interactive seating chart tool will help you arrange students for optimal learning dynamics
                </p>
                <Button onClick={handleCreateSeatingChart}>
                  Create Seating Chart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AuthenticatedLayout>
  );
}