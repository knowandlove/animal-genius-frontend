import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Clock, BookOpen, Users, Target, ListChecks, ArrowLeft, PlayCircle, Printer, FileText, Check as CheckIcon, Sun, Battery, Lock, ArrowRight, Calendar, Trophy, Vote, RotateCcw } from "lucide-react";
import { lessons, type Lesson, type Activity } from "@shared/lessons";
import { modules, type Module, getModuleById } from "@/shared/modules";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/config/api";
import { getIconComponent, getIconColor } from "@/utils/icon-utils";
import { LoadingSpinner } from "@/components/loading-spinner";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { ClassValuesSessionModal } from "@/components/ClassValuesSessionModal";

export default function LearningLounge() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [lessonProgressData, setLessonProgressData] = useState<any>(null);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authTokenChanged"));
    setLocation("/");
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setLocation("/login");
      return;
    }
    setToken(authToken);

    // Get classId, module, and lesson from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const classIdParam = urlParams.get("classId");
    const moduleParam = urlParams.get("module");
    const lessonParam = urlParams.get("lesson");
    
    if (classIdParam) {
      setClassId(classIdParam);
    }
    
    if (moduleParam) {
      setSelectedModule(moduleParam);
    }
    
    if (lessonParam) {
      setSelectedLesson(parseInt(lessonParam));
    }
  }, [setLocation]);

  // Fetch class name if classId is provided
  const { data: classData } = useQuery<{ id: string; name: string; passportCode: string; teacherId: string; iconEmoji?: string; iconColor?: string; icon?: string; backgroundColor?: string }>({
    queryKey: [`/api/classes/${classId}`],
    enabled: !!token && !!classId,
  });

  useEffect(() => {
    if (classData) {
      setClassName(classData.name);
    }
  }, [classData]);

  // Fetch lesson progress
  const { data: progressData, isLoading } = useQuery({
    queryKey: classId ? [`/api/classes/${classId}/lessons/progress`] : ["no-class-progress"],
    queryFn: async () => {
      if (!classId) {
        // Return empty progress when no class is selected
        return { lessons: [], completedLessons: 0, totalLessons: 5 };
      }
      const endpoint = api(`/api/classes/${classId}/lessons/progress`);
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch lesson progress");
      const data = await response.json();
      return data;
    },
    enabled: !!token,
  });

  // Update lessonProgressData when progressData changes
  useEffect(() => {
    if (progressData) {
      setLessonProgressData(progressData);
    }
  }, [progressData]);

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const endpoint = classId 
        ? `/api/classes/${classId}/lessons/${lessonId}/complete`
        : `/api/lessons/${lessonId}/complete`;
      return apiRequest("POST", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: classId ? [`/api/classes/${classId}/lessons/progress`] : ["/api/lessons/progress"] 
      });
      toast({
        title: "Lesson Complete!",
        description: "Great job! You've completed this lesson.",
      });
    },
  });
  
  const startLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const endpoint = `/api/classes/${classId}/lessons/${lessonId}/start`;
      return apiRequest("POST", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/classes/${classId}/lessons/progress`]
      });
    },
  });
  
  const completeActivityMutation = useMutation({
    mutationFn: async ({ lessonId, activityNumber }: { lessonId: number; activityNumber: number }) => {
      const endpoint = `/api/classes/${classId}/lessons/${lessonId}/activities/${activityNumber}/complete`;
      return apiRequest("POST", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/classes/${classId}/lessons/progress`]
      });
    },
  });

  const resetValuesVotingMutation = useMutation({
    mutationFn: async () => {
      // First check if there's an active session
      const statusResponse = await apiRequest('GET', `/api/classes/${classId}/lessons/4/activity/2/status`);
      if (statusResponse?.hasActiveSession) {
        // Reset the active session
        return await apiRequest('POST', `/api/class-values/reset-session/${statusResponse.sessionId}`);
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/classes/${classId}/lessons/progress`]
      });
      toast({
        title: "Voting Reset!",
        description: "All votes have been cleared and the session has been reset.",
      });
    },
    onError: (error) => {
      toast({
        title: "Reset Failed",
        description: "Could not reset the voting session. Please try again.",
        variant: "destructive"
      });
    }
  });

  const isLessonComplete = (lessonId: number) => {
    if (!progressData?.lessons) return false;
    const lesson = progressData.lessons.find((l: any) => l.lessonId === lessonId);
    return lesson?.status === 'completed';
  };
  
  const getLessonProgress = (lessonId: number) => {
    if (!progressData?.lessons) return null;
    return progressData.lessons.find((l: any) => l.lessonId === lessonId);
  };

  const handleMarkComplete = (lessonId: number) => {
    markCompleteMutation.mutate(lessonId);
  };

  if (!token) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId || undefined}
        className={className || undefined}
        user={undefined}
        onLogout={handleLogout}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId || undefined}
        className={className || undefined}
        user={undefined}
        onLogout={handleLogout}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // Show lesson detail if a lesson is selected
  if (selectedLesson) {
    const lesson = lessons.find(l => l.id === selectedLesson);
    if (!lesson) return null;

    return <LessonDetailView 
      lesson={lesson}
      lessonProgress={getLessonProgress(lesson.id)}
      isComplete={isLessonComplete(lesson.id)}
      onMarkComplete={() => handleMarkComplete(lesson.id)}
      onStartLesson={() => startLessonMutation.mutate(lesson.id)}
      onCompleteActivity={(activityNumber) => completeActivityMutation.mutate({ lessonId: lesson.id, activityNumber })}
      onResetValuesVoting={() => resetValuesVotingMutation.mutate()}
      onBack={() => {
        setSelectedLesson(null);
        // Update URL to show module view
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('lesson');
        window.history.replaceState({}, '', newUrl.toString());
      }}
      isMarkingComplete={markCompleteMutation.isPending}
      isResettingVoting={resetValuesVotingMutation.isPending}
      classId={classId}
      className={className}
    />;
  }
  
  // Show module lessons if a module is selected
  if (selectedModule) {
    const module = getModuleById(selectedModule);
    if (!module) return null;
    
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId || undefined}
        className={className || undefined}
        user={undefined}
        onLogout={handleLogout}
      >
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {classData && (
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: getIconColor(classData.iconColor, classData.backgroundColor) }}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(classData.icon || classData.iconEmoji);
                      return <IconComponent className="w-8 h-8 text-white" />;
                    })()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <button 
                      onClick={() => {
                        setSelectedModule(null);
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.delete('module');
                        window.history.replaceState({}, '', newUrl.toString());
                      }}
                      className="hover:text-gray-700 transition-colors"
                    >
                      Learning Lounge
                    </button>
                    <ArrowRight className="h-3 w-3" />
                    <span>{module.title}</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {module.title}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {module.description}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedModule(null);
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.delete('module');
                  window.history.replaceState({}, '', newUrl.toString());
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Modules
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              isComplete={isLessonComplete(lesson.id)}
              onSelect={() => {
                setSelectedLesson(lesson.id);
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('lesson', lesson.id.toString());
                window.history.replaceState({}, '', newUrl.toString());
              }}
              onMarkComplete={() => handleMarkComplete(lesson.id)}
              isMarkingComplete={markCompleteMutation.isPending}
            />
          ))}
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout 
      showSidebar={true}
      classId={classId || undefined}
      className={className || undefined}
      user={undefined}
      onLogout={handleLogout}
    >
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {classData && (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: getIconColor(classData.iconColor, classData.backgroundColor) }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(classData.icon || classData.iconEmoji);
                    return <IconComponent className="w-8 h-8 text-white" />;
                  })()}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {className ? `Learning Lounge - ${className}` : "Learning Lounge"}
                </h1>
                <p className="text-gray-600 mt-2">
                  {className 
                    ? `Professional development resources and lesson plans for ${className}`
                    : "Professional development resources and lesson plans"
                  }
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation(classId ? `/class/${classId}/dashboard` : "/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {classId ? "Back to Class Dashboard" : "Back to Dashboard"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Selection View */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            progressData={module.id === 'week-of-connection' ? lessonProgressData : null}
            onSelect={() => {
              if (module.status === 'active') {
                setSelectedModule(module.id);
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('module', module.id);
                window.history.replaceState({}, '', newUrl.toString());
              }
            }}
          />
        ))}
      </div>
    </AuthenticatedLayout>
  );
}

interface LessonCardProps {
  lesson: Lesson;
  isComplete: boolean;
  onSelect: () => void;
  onMarkComplete: () => void;
  isMarkingComplete: boolean;
}

function LessonCard({ lesson, isComplete, onSelect, onMarkComplete, isMarkingComplete }: LessonCardProps) {
  return (
    <Card className={`relative cursor-pointer transition-all hover:shadow-lg ${isComplete ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Lesson {lesson.id}: {lesson.title}</CardTitle>
                {isComplete && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700 mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
            </div>
            
            <CardDescription className="text-base">{lesson.description}</CardDescription>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 text-[#BAC97D]">
                <Clock className="h-4 w-4" />
                {lesson.duration}
              </div>
              <div className="flex items-center gap-1 text-[#85B2C8]">
                <Users className="h-4 w-4" />
                Class Activity
              </div>
              {lesson.materialsNeeded.some(m => m.toLowerCase().includes('worksheet')) && (
                <div className="flex items-center gap-1 text-[#FF8070]">
                  <FileText className="h-4 w-4" />
                  Includes Worksheet
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isComplete && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkComplete();
                }}
                disabled={isMarkingComplete}
                variant="outline"
                size="sm"
              >
                {isMarkingComplete ? <LoadingSpinner size="sm" /> : "Mark Complete"}
              </Button>
            )}
            <Button onClick={onSelect} size="sm">
              <PlayCircle className="h-4 w-4 mr-1" />
              Start Lesson
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="preview">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Lesson Preview
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-blue-700 dark:text-blue-400 mb-2">
                    Learning Objectives
                  </h4>
                  <ul className="space-y-1">
                    {lesson.objectives.slice(0, 2).map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-[#829B79] flex-shrink-0" />
                        <span className="text-sm">{objective}</span>
                      </li>
                    ))}
                    {lesson.objectives.length > 2 && (
                      <li className="text-sm text-muted-foreground ml-6">
                        +{lesson.objectives.length - 2} more objectives...
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-purple-700 dark:text-purple-400 mb-2">
                    Materials Needed
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {lesson.materialsNeeded.slice(0, 3).map((material, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                    {lesson.materialsNeeded.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{lesson.materialsNeeded.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

interface LessonDetailViewProps {
  lesson: Lesson;
  lessonProgress: any;
  isComplete: boolean;
  onMarkComplete: () => void;
  onStartLesson: () => void;
  onCompleteActivity: (activityNumber: number) => void;
  onResetValuesVoting: () => void;
  onBack: () => void;
  isMarkingComplete: boolean;
  isResettingVoting: boolean;
  classId: string | null;
  className?: string | null;
}

function LessonDetailView({ lesson, lessonProgress, isComplete, onMarkComplete, onStartLesson, onCompleteActivity, onResetValuesVoting, onBack, isMarkingComplete, isResettingVoting, classId, className }: LessonDetailViewProps) {
  const [, setLocation] = useLocation();
  const [startingLesson, setStartingLesson] = useState(false);
  const [showValuesVotingModal, setShowValuesVotingModal] = useState(false);
  
  // Start lesson if not started
  useEffect(() => {
    if (!lessonProgress && !startingLesson && !isComplete) {
      setStartingLesson(true);
      onStartLesson();
    }
  }, [lessonProgress, startingLesson, isComplete]); // Removed onStartLesson from dependencies
  
  // Check if activity is complete
  const isActivityComplete = (activityNumber: number) => {
    if (!lessonProgress?.activities) return false;
    return lessonProgress.activities.some((a: any) => 
      a.activityNumber === activityNumber && a.completed
    );
  };
  
  const handlePrintWorksheet = () => {
    // For now, open the pre-assessment page for any worksheet-related lesson
    setLocation("/pre-assessment");
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authTokenChanged"));
    setLocation("/");
  };

  return (
    <AuthenticatedLayout 
      showSidebar={true}
      classId={classId || undefined}
      className={className || undefined}
      user={undefined}
      onLogout={handleLogout}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Lounge
          </Button>
          
          <div className="flex gap-2">
            {lesson.materialsNeeded.some(m => m.toLowerCase().includes('worksheet')) && (
              <Button
                onClick={handlePrintWorksheet}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Worksheet
              </Button>
            )}
            {!isComplete && (
              <Button
                onClick={onMarkComplete}
                disabled={isMarkingComplete}
                className="flex items-center gap-2"
              >
                {isMarkingComplete ? <LoadingSpinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
                Mark Complete
              </Button>
            )}
          </div>
        </div>

        <Card className={`mb-6 ${isComplete ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : ''}`}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Lesson {lesson.id}: {lesson.title}</CardTitle>
                <CardDescription className="text-lg">{lesson.description}</CardDescription>
              </div>
              {isComplete && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Badge variant="secondary" className="flex items-center gap-1 bg-[#BAC97D] text-gray-800 border-0">
                <Clock className="h-3 w-3" />
                {lesson.duration}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 bg-[#85B2C8] text-white border-0">
                <Users className="h-3 w-3" />
                Class Activity
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 bg-[#FF8070] text-white border-0">
                <Target className="h-3 w-3" />
                {lesson.objectives.length} Objectives
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LessonSectionsView 
              lesson={lesson} 
              lessonProgress={lessonProgress}
              onCompleteActivity={onCompleteActivity}
              onResetValuesVoting={onResetValuesVoting}
              isActivityComplete={isActivityComplete}
              isResettingVoting={isResettingVoting}
              classId={classId}
              onShowValuesVoting={() => setShowValuesVotingModal(true)}
            />
          </div>
          
          <div className="space-y-6">
            <LessonSidebar lesson={lesson} />
          </div>
        </div>

        {/* Class Values Voting Modal */}
        {classId && (
          <ClassValuesSessionModal
            isOpen={showValuesVotingModal}
            onClose={() => setShowValuesVotingModal(false)}
            classId={classId}
            onSessionComplete={() => {
              // Refresh the lesson progress when voting session completes
              window.location.reload();
            }}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function LessonSectionsView({ lesson, lessonProgress, onCompleteActivity, onResetValuesVoting, isActivityComplete, isResettingVoting, classId, onShowValuesVoting }: { 
  lesson: Lesson; 
  lessonProgress?: any;
  onCompleteActivity: (activityNumber: number) => void;
  onResetValuesVoting: () => void;
  isActivityComplete: (activityNumber: number) => boolean;
  isResettingVoting: boolean;
  classId: string | null;
  onShowValuesVoting: () => void;
}) {
  // Check if lesson has activities (new structure) or sections (old structure)
  if (!lesson.activities) {
    return (
      <div className="space-y-6">
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle>Lesson content is being updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">This lesson is currently being migrated to the new format. Please check back soon.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show all 4 activities
  const activities = [
    { key: 'activity1', data: lesson.activities.activity1, color: 'green', number: 1 },
    { key: 'activity2', data: lesson.activities.activity2, color: 'purple', number: 2 },
    { key: 'activity3', data: lesson.activities.activity3, color: 'orange', number: 3 },
    { key: 'activity4', data: lesson.activities.activity4, color: 'teal', number: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Video placeholder for all lessons */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Lesson Overview Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <PlayCircle className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Video Coming Soon</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">{lesson.title}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {activities.map(({ key, data, color, number }) => {
        // Using a subtle off-white background for all cards
        const cardClassName = 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900';
        
        // Using brand colors from the animal palette
        const colorAccents = {
          green: {
            border: 'border-l-4 border-l-[#829B79]', // Beaver green
            badge: 'bg-[#829B79] text-white',
            icon: 'text-[#829B79]'
          },
          purple: {
            border: 'border-l-4 border-l-[#85B2C8]', // Panda blue
            badge: 'bg-[#85B2C8] text-white',
            icon: 'text-[#85B2C8]'
          },
          orange: {
            border: 'border-l-4 border-l-[#FF8070]', // Parrot coral
            badge: 'bg-[#FF8070] text-white',
            icon: 'text-[#FF8070]'
          },
          teal: {
            border: 'border-l-4 border-l-[#BD85C8]', // Elephant purple
            badge: 'bg-[#BD85C8] text-white',
            icon: 'text-[#BD85C8]'
          }
        };
        
        const accent = colorAccents[color as keyof typeof colorAccents];

        const isComplete = isActivityComplete(number);
        
        return (
          <Card key={key} className={`${cardClassName} ${accent.border} ${isComplete ? 'bg-green-50 dark:bg-green-950' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className={`h-5 w-5 ${accent.icon}`} />
                  Activity {number}: {data.title}
                  {data.optional && (
                    <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-default">
                      Optional
                    </Badge>
                  )}
                </CardTitle>
                <div>
                  {/* Special handling for Activity 2 of Lesson 4 (Class Values Voting) - always show buttons for testing */}
                  {lesson.id === 4 && number === 2 ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={onShowValuesVoting}
                        size="sm"
                        className="bg-[#85B2C8] hover:bg-[#6d94a6] text-white text-xs"
                      >
                        <Vote className="w-3 h-3 mr-1" />
                        Start Class Values Voting
                      </Button>
                      {isComplete && (
                        <Button
                          onClick={() => window.open(`/class-values-results/${classId}`, '_blank')}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          <Trophy className="w-3 h-3 mr-1" />
                          View Results
                        </Button>
                      )}
                      <Button
                        onClick={onResetValuesVoting}
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        disabled={isResettingVoting}
                      >
                        {isResettingVoting ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset Voting
                          </>
                        )}
                      </Button>
                    </div>
                  ) : isComplete ? (
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">Complete</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => onCompleteActivity(number)}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Special description for Activity 4 */}
              {key === 'activity4' && lesson.id === 1 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  Extend self-awareness into the home by exploring family personality dynamics in a fun and inclusive way.
                </p>
              )}
              
              {/* Steps */}
              <div>
                <ol className="space-y-4">
                  {data.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="font-medium text-sm bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0">
                          {stepIndex + 1}
                        </span>
                        <div className="flex-1 space-y-2">
                          <span className="text-sm">{step.instruction}</span>
                          
                          {/* Pro Tips for this step */}
                          {step.tips && step.tips.length > 0 && (
                            <div className="ml-4 p-3 bg-[#85B2C8]/10 border border-[#85B2C8]/20 rounded-lg">
                              <h5 className="text-xs font-semibold text-[#85B2C8] mb-1">Pro Tip{step.tips.length > 1 ? 's' : ''}:</h5>
                              <ul className="space-y-1">
                                {step.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="flex items-start gap-2">
                                    <Target className="h-3 w-3 mt-0.5 text-[#85B2C8] flex-shrink-0" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Guiding Questions for this step */}
                          {step.guidingQuestions && step.guidingQuestions.length > 0 && (
                            <div className="ml-4 p-3 bg-[#BD85C8]/10 border border-[#BD85C8]/20 rounded-lg">
                              <h5 className="text-xs font-semibold text-[#BD85C8] mb-1">Guiding Questions:</h5>
                              <ul className="space-y-1">
                                {step.guidingQuestions.map((question, qIndex) => (
                                  <li key={qIndex} className="flex items-start gap-2">
                                    <Users className="h-3 w-3 mt-0.5 text-[#BD85C8] flex-shrink-0" />
                                    <span className="text-xs italic text-gray-700 dark:text-gray-300">{question}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function LessonSidebar({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {lesson.objectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-[#829B79] flex-shrink-0" />
                <span className="text-sm">{objective}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Materials Needed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {lesson.materialsNeeded.map((material, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-[#85B2C8] rounded-full flex-shrink-0" />
                <span className="text-sm">{material}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {lesson.id === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Downloadable PDF resources for this lesson:
            </p>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline flex items-center gap-1">
                  <Printer className="h-3 w-3" />
                  Table Tent template
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline flex items-center gap-1">
                  <Printer className="h-3 w-3" />
                  Knowing and Loving, Me! Worksheet
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline flex items-center gap-1">
                  <Printer className="h-3 w-3" />
                  Parent Letter
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline flex items-center gap-1">
                  <Printer className="h-3 w-3" />
                  Who's in My Family Zoo Worksheet
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline flex items-center gap-1">
                  <Printer className="h-3 w-3" />
                  Animal Genius Quiz® Result Print-outs
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {lesson.id === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Core Academic Influences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Carl Jung – Theory of Psychological Types
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Jung's work on how people perceive and decide forms the foundation of the Animal Genius Quiz®, reframed into kid-friendly animal metaphors that help students understand how they think and connect.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Zaretta Hammond – Culturally Responsive Teaching and the Brain
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Hammond stresses the importance of identity in learning. The quiz supports her independence-building strategies by helping students name how they think, learn, and process the world.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Claude Steele – Stereotype Threat and Identity Safety
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Steele's research shows that students thrive when their identity is valued. The Animal Genius Quiz® provides a safe, affirming starting point that reduces stereotype threat and boosts belonging.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Carol Dweck – Growth Mindset
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Dweck reminds us identity isn't fixed. The quiz helps students see personality as a launchpad for growth, not a label.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Maurice Elias & CASEL – SEL Framework
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  This lesson builds CASEL's first competency—self-awareness—by helping students recognize their strengths and traits in a joyful, memorable way.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Debbie Miller – Reading with Meaning
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Miller champions helping kids "see themselves as learners." The table tents and reflections give students the words to describe how they learn, right from Day 1.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Claude & Dorothy Steele – Identity-Safe Classrooms
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Students engage more deeply when their identity is affirmed. Your first week builds this safety into the classroom through personality-based self-awareness and celebration.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lesson.id === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Core Academic Influences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Rudine Sims Bishop – "Mirrors, Windows, and Sliding Glass Doors"
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Bishop's metaphor shows the importance of students seeing themselves and others in the learning environment. This lesson creates a "mirror" by letting students reflect on their shared identity with others in their animal group.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Zaretta Hammond – Culturally Responsive Teaching and the Brain
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Hammond argues that students need "affinity groups" as launching pads for deeper learning. By designing a home with others who think and feel like them, students build confidence, voice, and comfort.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Brené Brown – Belonging vs. Fitting In
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Brown defines belonging as being accepted for who you are, while "fitting in" requires you to change yourself. This activity shows students that they already belong, just as they are.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Christina Hinton (Harvard) – Belonging and Learning Are Intertwined
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Hinton's research confirms that when students feel socially connected and valued, their brains are more open to learning. Designing a physical space that reflects their identity helps foster that connection.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  CASEL Framework – Social Awareness & Relationship Skills
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  This lesson builds social awareness by helping students recognize common traits and shared preferences in their animal group. It sets the stage for building relationship skills as they connect their inner identity to a collective one.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lesson.id === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Core Academic Influences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Howard Gardner – Theory of Multiple Intelligences
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Gardner's work emphasizes that intelligence isn't one-size-fits-all—it's varied and personal. This activity honors different ways of thinking, learning, and creating, helping students name and visualize those preferences without ranking or judgment.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  James A. Banks – Multicultural Education Theory
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Banks outlines five dimensions of inclusive education, including "knowledge construction" and "prejudice reduction." By analyzing where their preferences land on a graph—and seeing how others differ—students start to build awareness of perspective and reduce judgment around differences.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Carol Dweck – Growth Mindset
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  This lesson helps students reframe preferences not as limitations, but as natural tendencies they can grow from. It reinforces the idea that how you do something today isn't how you'll always do it, which cultivates open-mindedness and self-efficacy.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Daniel Kahneman – Thinking, Fast and Slow
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Kahneman's research on cognitive processing (System 1 vs. System 2 thinking) supports the idea that people approach tasks in different ways—some intuitively, others methodically. By charting their own preferences, students develop metacognition about their default styles.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-707 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Zaretta Hammond – Culturally Responsive Teaching and the Brain
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Hammond explains that helping students understand how their brains process information creates pathways for deeper learning. This lesson introduces processing and preference in a visual, engaging way—inviting students to value their "neuro-uniqueness."
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  CASEL Framework – Self-Awareness & Responsible Decision-Making
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  This lesson reinforces self-awareness by helping students name how they prefer to engage with the world. It also begins developing responsible decision-making by showing how their choices and preferences affect group dynamics.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  National Council of Teachers of Mathematics (NCTM)
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  By introducing a simple graphing activity (positive coordinate grid for 4th–5th grade and four-quadrant Cartesian plane for 6th), this lesson bridges math and SEL, showing that data and personal identity can coexist—and that math can help us understand ourselves and others.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lesson.id === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Core Academic Influences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Zaretta Hammond – Culturally Responsive Teaching and the Brain
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Hammond emphasizes the importance of co-created norms for developing "identity safety" and cognitive trust. Shared values anchor a culture where students feel empowered and seen.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Claude Steele – Stereotype Threat and Identity Safety
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Claude Steele's research shows that students need "identity-safe" environments where they help shape norms. Agreements built on chosen values reduce stereotype threat and increase belonging.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  CASEL – SEL Framework
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Individual voice, choice, and safety are central to belonging and classroom trust. This lesson builds all three competencies by giving students agency in creating their shared agreements.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Read more
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ModuleCardProps {
  module: Module;
  progressData?: any;
  onSelect: () => void;
}

function ModuleCard({ module, progressData, onSelect }: ModuleCardProps) {
  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return Users;
      case 'Sun':
        return Sun;
      case 'Battery':
        return Battery;
      case 'Trophy':
        return Trophy;
      default:
        return BookOpen;
    }
  };

  const IconComponent = getModuleIcon(module.icon);

  const getProgressInfo = () => {
    if (module.id === 'week-of-connection' && progressData) {
      const completed = progressData.completedLessons || 0;
      const total = progressData.totalLessons || 5;
      const percentage = Math.round((completed / total) * 100);
      return { completed, total, percentage };
    }
    return null;
  };

  const progress = getProgressInfo();

  return (
    <Card 
      className={`relative cursor-pointer transition-all hover:shadow-lg ${
        module.status === 'coming_soon' 
          ? 'opacity-75 cursor-not-allowed' 
          : 'hover:shadow-lg'
      }`}
      onClick={module.status === 'active' ? onSelect : undefined}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg flex-shrink-0"
              style={{ backgroundColor: module.color + '33' }}
            >
              <IconComponent 
                className="h-6 w-6" 
                style={{ color: module.color }}
              />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {module.title}
                {module.status === 'coming_soon' && (
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                )}
                {module.status === 'locked' && (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
              </CardTitle>
            </div>
          </div>
        </div>
        
        <CardDescription className="text-base mt-3">
          {module.status === 'coming_soon' && module.comingSoonMessage ? 
            module.comingSoonMessage : 
            module.description
          }
        </CardDescription>

        {/* Progress Bar for Week of Connection */}
        {progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {progress.completed}/{progress.total} lessons completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: module.color,
                  width: `${progress.percentage}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Module Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
          {module.estimatedDuration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {module.estimatedDuration}
            </div>
          )}
          {module.lessonCount && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {module.lessonCount} lessons
            </div>
          )}
          {module.status === 'coming_soon' && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Coming Soon
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {module.status === 'active' ? (
          <Button 
            className="w-full" 
            style={{ backgroundColor: module.color }}
            onClick={onSelect}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {progress && progress.completed > 0 ? 'Continue Module' : 'Start Module'}
          </Button>
        ) : (
          <Button 
            className="w-full" 
            variant="outline" 
            disabled
          >
            {module.status === 'coming_soon' ? 'Coming Soon' : 'Locked'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}