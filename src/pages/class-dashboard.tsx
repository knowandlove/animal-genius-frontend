import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAnimalByName } from "@/lib/animals";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/config/api";
import { getAssetUrl } from "@/utils/cloud-assets";
import { getIconComponent, getIconColor } from "@/utils/icon-utils";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { 
  Monitor, 
  Upload, 
  Eye, 
  Volume2, 
  Zap, 
  BookOpen, 
  MapPin, 
  Coins, 
  Plus, 
  Minus, 
  Store, 
  Settings, 
  Trash2, 
  Loader2,
  ArrowLeft,
  Users,
  BarChart3,
  UserPlus,
  Share2,
  Play,
  CheckCircle,
  Copy,
  ExternalLink,
  Wifi,
} from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useClassContext } from "@/hooks/useClassContext";
import { useAuth } from "@/hooks/useAuth";
import { useLastAccessedClass } from "@/hooks/useLastAccessedClass";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Submission {
  id: string;
  studentName: string;
  gradeLevel: string;
  personalityType: string;
  animalType: string;
  animalGenius: string;
  geniusType: string;
  learningStyle: string;
  learningScores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    readingWriting: number;
  };
  completedAt: string;
  passportCode?: string;
  currencyBalance?: number;
}

interface ClassAnalyticsData {
  class: {
    id: number;
    name: string;
    code: string;
    teacherId: number;
    iconEmoji?: string;
    iconColor?: string;
    icon?: string;
    backgroundColor?: string;
  };
  stats: {
    totalSubmissions: number;
    animalDistribution: Record<string, number>;
    personalityDistribution: Record<string, number>;
    learningStyleDistribution: Record<string, number>;
    animalGeniusDistribution?: Record<string, number>;
    geniusTypeDistribution?: Record<string, number>;
  };
  submissions: Submission[];
}

export default function ClassDashboard() {
  const { classId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { role } = useClassContext();
  const { user, isLoading: authLoading } = useAuth();
  const { saveLastAccessedClass } = useLastAccessedClass();
  const [lessonProgress, setLessonProgress] = useState<any>(null);

  // Save this class as the last accessed when the component mounts
  useEffect(() => {
    if (classId && user) {
      saveLastAccessedClass(classId);
    }
  }, [classId, user, saveLastAccessedClass]);

  // Fetch class analytics data
  const { data, isLoading, error } = useQuery<ClassAnalyticsData>({
    queryKey: [`/api/classes/${classId}/analytics`],
    enabled: !!classId,
  });

  // Fetch all students in class
  const { data: studentsData } = useQuery({
    queryKey: [`/api/classes/${classId}/students`],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(api(`/api/classes/${classId}/students`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
    enabled: !!classId && !!user,
  });

  // Fetch lesson progress
  const { data: lessonProgressData } = useQuery({
    queryKey: [`/api/classes/${classId}/lessons/progress`],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(api(`/api/classes/${classId}/lessons/progress`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch lesson progress");
      return response.json();
    },
    enabled: !!classId && !!user,
  });

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authTokenChanged"));
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
    setLocation("/");
  };

  // Handle loading and error states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        className={undefined}
        classCode={undefined}
        user={user}
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !data) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        user={user}
        onLogout={handleLogout}
      >
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Failed to load class dashboard data.</p>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/dashboard")}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </AuthenticatedLayout>
    );
  }

  const classData = data.class;
  const submissions = data.submissions;
  const stats = data.stats;

  // Get icon component and color
  const IconComponent = getIconComponent(classData.icon || classData.iconEmoji || "📚");
  const iconColor = getIconColor(classData.backgroundColor || classData.iconColor || "#c5d49f");

  // Quick access actions
  const quickAccessActions = [
    {
      id: 'island',
      label: 'Class Island',
      description: 'Virtual space',
      icon: MapPin,
      color: 'blue',
      action: () => setLocation(`/teacher/class/${classId}/island`)
    },
    {
      id: 'live-discovery',
      label: 'Live Discovery',
      description: 'Real-time view',
      icon: Wifi,
      color: 'red',
      action: () => setLocation(`/classes/${classId}/live`)
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Charts & data',
      icon: BarChart3,
      color: 'purple',
      action: () => setLocation(`/class/${classId}/analytics`)
    },
    {
      id: 'students',
      label: 'Students',
      description: 'Manage list',
      icon: Users,
      color: 'green',
      action: () => setLocation(`/class/${classId}/analytics`)
    },
    {
      id: 'groups',
      label: 'Groups',
      description: 'Smart pairs',
      icon: UserPlus,
      color: 'indigo',
      action: () => setLocation('/group-maker')
    },
    {
      id: 'economy',
      label: 'Class Economy',
      description: 'Manage coins',
      icon: Coins,
      color: 'yellow',
      action: () => setLocation(`/class/${classId}/economy`)
    }
  ];

  // Get color classes for action buttons
  const getActionColorClasses = (color: string) => {
    const colorMap = {
      blue: 'hover:bg-blue-50 hover:border-blue-300 text-blue-600',
      purple: 'hover:bg-purple-50 hover:border-purple-300 text-purple-600',
      green: 'hover:bg-green-50 hover:border-green-300 text-green-600',
      indigo: 'hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600',
      yellow: 'hover:bg-yellow-50 hover:border-yellow-300 text-yellow-600',
      red: 'hover:bg-red-50 hover:border-red-300 text-red-600',
      orange: 'hover:bg-orange-50 hover:border-orange-300 text-orange-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <AuthenticatedLayout 
      showSidebar={true}
      classId={classId}
      className={classData.name}
      classCode={classData.code}
      user={user}
      onLogout={handleLogout}
    >
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconColor }}
          >
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-heading text-foreground">
              {classData.name}
            </h1>
            <p className="font-body text-muted-foreground">
              Class Code: <span className="font-semibold">{classData.code}</span>
            </p>
          </div>
        </div>
      </div>

          {/* Quick Access Section */}
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickAccessActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg transition-all hover:shadow-md ${getActionColorClasses(action.color)}`}
                >
                  <div className={`w-12 h-12 bg-${action.color}-100 rounded-full flex items-center justify-center mb-2`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{action.label}</span>
                  <span className="text-xs text-gray-500">{action.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Learning Lounge Section */}
          <div className="mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-heading text-foreground">Lesson Progress</h3>
                    <p className="text-sm font-body text-muted-foreground">Your class is working through the curriculum</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {lessonProgressData?.inProgressLessons > 0 
                        ? `Lesson ${lessonProgressData.lessons.find((l: any) => l.status === 'in_progress')?.lessonId || 1} of ${lessonProgressData.totalLessons}`
                        : lessonProgressData?.completedLessons > 0
                        ? `${lessonProgressData.completedLessons} of ${lessonProgressData.totalLessons} Complete`
                        : `0 of ${lessonProgressData?.totalLessons || 5} Started`
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(((lessonProgressData?.completedLessons || 0) / (lessonProgressData?.totalLessons || 5)) * 100)}% Complete
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div 
                      className="h-3 bg-[#c6e3db] rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${((lessonProgressData?.completedLessons || 0) / (lessonProgressData?.totalLessons || 5)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                {/* Current Lesson Info */}
                {lessonProgressData?.lessons && lessonProgressData.lessons.length > 0 ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {lessonProgressData.lessons.find((l: any) => l.status === 'in_progress')
                            ? `Continue Lesson ${lessonProgressData.lessons.find((l: any) => l.status === 'in_progress').lessonId}`
                            : 'Start Next Lesson'
                          }
                        </div>
                        <div className="text-sm text-gray-600">
                          {lessonProgressData.inProgressLessons > 0 
                            ? 'Pick up where you left off'
                            : 'Begin your learning journey'
                          }
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        const currentLesson = lessonProgressData.lessons.find((l: any) => l.status === 'in_progress');
                        const nextLessonId = currentLesson ? currentLesson.lessonId : (lessonProgressData.completedLessons + 1);
                        setLocation(`/learning-lounge?classId=${classId}&module=week-of-connection&lesson=${nextLessonId}`);
                      }}
                    >
                      {lessonProgressData.inProgressLessons > 0 ? 'Resume Lesson' : 'Start Lesson'} →
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Ready to begin?</div>
                        <div className="text-sm text-gray-600">Start your first lesson in the Learning Lounge</div>
                      </div>
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setLocation(`/learning-lounge?classId=${classId}`)}
                    >
                      Go to Learning Lounge →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Student List Table */}
          <div className="mb-8">
            <h2 className="text-xl font-heading text-foreground mb-4">
              👥 Students ({studentsData?.totalStudents || stats.totalSubmissions} total, {studentsData?.studentsWithQuiz || stats.totalSubmissions} completed quiz)
            </h2>
            <Card className="hover:shadow-lg transition-shadow">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genius</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learning</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Island</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coins</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {(studentsData?.students || submissions).map((student: any) => {
                      const animal = getAnimalByName(student.animalType);
                      const hasCompletedQuiz = !!student.completedAt;
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                              {student.studentName}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {hasCompletedQuiz ? (
                              <div className="flex items-center">
                                <img 
                                  src={getAssetUrl(animal?.imagePath || '/animals/kal-character.png')} 
                                  alt={student.animalType} 
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                                <span className="text-sm">{student.animalType}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Not taken</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {hasCompletedQuiz ? (
                              <Badge 
                                variant="secondary" 
                                className="text-xs text-white"
                                style={{ 
                                  backgroundColor: student.geniusType === 'Thinker' ? '#8B5CF6' : 
                                                  student.geniusType === 'Feeler' ? '#10B981' : '#F59E0B' 
                                }}
                              >
                                {student.geniusType}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">
                              {hasCompletedQuiz ? student.learningStyle : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500">
                              {hasCompletedQuiz 
                                ? format(new Date(student.completedAt), 'MMM d, h:mm a')
                                : 'Not completed'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {student.passportCode || 'N/A'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center text-sm">
                              <Coins className="w-4 h-4 text-yellow-500 mr-1" />
                              {student.currencyBalance || 50}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setLocation(`/teacher/student/${student.id}?classId=${classId}&from=dashboard`)}
                              >
                                View Report
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Quick Share Links */}
          <div className="mb-8">
            <h2 className="text-xl font-heading text-foreground mb-4">🔗 Quick Share Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Class Quiz Share */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-heading text-foreground mb-2">Class Quiz</h3>
                    <p className="text-sm font-body text-muted-foreground">
                      Share this code for students to join and take the quiz
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono text-blue-600 bg-blue-50 px-6 py-3 rounded-lg border-2 border-blue-200 mb-2">
                        {classData.code}
                      </div>
                      <div className="text-xs text-gray-500">Class Code</div>
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white ml-4"
                      onClick={() => {
                        const url = `${window.location.origin}/q/${classData.code}`;
                        navigator.clipboard.writeText(url);
                        toast({
                          title: "Link copied!",
                          description: "Quiz link has been copied to clipboard.",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    Or write this code on the board: <span className="font-bold font-mono text-blue-600">{classData.code}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Class Island Share */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-heading text-foreground mb-2">Class Island</h3>
                    <p className="text-sm font-body text-muted-foreground">
                      Share this link for students to visit your class island
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono text-green-600 bg-green-50 px-6 py-3 rounded-lg border-2 border-green-200 mb-2">
                        {classData.code}
                      </div>
                      <div className="text-xs text-gray-500">Class Code</div>
                    </div>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white ml-4"
                      onClick={() => {
                        const url = `${window.location.origin}/class/${classData.code}`;
                        navigator.clipboard.writeText(url);
                        toast({
                          title: "Link copied!",
                          description: "Class Island link has been copied to clipboard.",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    Or write this code on the board: <span className="font-bold font-mono text-green-600">{classData.code}</span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

    </AuthenticatedLayout>
  );
}