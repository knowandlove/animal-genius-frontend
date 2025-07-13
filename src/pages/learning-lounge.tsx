import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Clock, BookOpen, Users, Target, ListChecks, ArrowLeft, PlayCircle, Printer, FileText } from "lucide-react";
import { lessons, type Lesson, type Activity } from "@shared/lessons";
import { apiRequest } from "@/lib/queryClient";
import { getIconComponent, getIconColor } from "@/utils/icon-utils";
import { LoadingSpinner } from "@/components/loading-spinner";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";

export default function LearningLounge() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);

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

    // Get classId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const classIdParam = urlParams.get("classId");
    if (classIdParam) {
      setClassId(classIdParam);
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

  const { data: completedLessons = [], isLoading } = useQuery<number[]>({
    queryKey: classId ? [`/api/classes/${classId}/lessons/progress`] : ["/api/lessons/progress"],
    enabled: !!token,
  });

  const markCompleteMutation = useMutation({
    mutationFn: (lessonId: number) =>
      classId 
        ? apiRequest("POST", `/api/classes/${classId}/lessons/${lessonId}/complete`)
        : apiRequest("POST", `/api/lessons/${lessonId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: classId ? [`/api/classes/${classId}/lessons/progress`] : ["/api/lessons/progress"] 
      });
    },
  });

  const isLessonComplete = (lessonId: number) => {
    return Array.isArray(completedLessons) && completedLessons.includes(lessonId);
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

  if (selectedLesson) {
    const lesson = lessons.find(l => l.id === selectedLesson);
    if (!lesson) return null;

    return <LessonDetailView 
      lesson={lesson}
      isComplete={isLessonComplete(lesson.id)}
      onMarkComplete={() => handleMarkComplete(lesson.id)}
      onBack={() => setSelectedLesson(null)}
      isMarkingComplete={markCompleteMutation.isPending}
    />;
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
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
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
            onSelect={() => setSelectedLesson(lesson.id)}
            onMarkComplete={() => handleMarkComplete(lesson.id)}
            isMarkingComplete={markCompleteMutation.isPending}
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
  isComplete: boolean;
  onMarkComplete: () => void;
  onBack: () => void;
  isMarkingComplete: boolean;
}

function LessonDetailView({ lesson, isComplete, onMarkComplete, onBack, isMarkingComplete }: LessonDetailViewProps) {
  const [, setLocation] = useLocation();
  
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
      classId={undefined}
      className={undefined}
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
            <LessonSectionsView lesson={lesson} />
          </div>
          
          <div className="space-y-6">
            <LessonSidebar lesson={lesson} />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function LessonSectionsView({ lesson }: { lesson: Lesson }) {
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

        return (
          <Card key={key} className={`${cardClassName} ${accent.border}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className={`h-5 w-5 ${accent.icon}`} />
                Activity {number}: {data.title}
                {data.optional && (
                  <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-default">
                    Optional
                  </Badge>
                )}
              </CardTitle>
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
    </div>
  );
}