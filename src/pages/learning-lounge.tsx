import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Clock, BookOpen, Users, Target, ListChecks, ArrowLeft, PlayCircle, Printer, FileText } from "lucide-react";
import { lessons, type Lesson } from "@shared/lessons";
import { apiRequest } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function LearningLounge() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [className, setClassName] = useState<string | null>(null);

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
      setClassId(parseInt(classIdParam));
    }
  }, [setLocation]);

  // Fetch class name if classId is provided
  const { data: classData } = useQuery<{ id: number; name: string; code: string; teacherId: number; iconEmoji?: string; iconColor?: string }>({
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
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
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
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {classData && (
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: classData.iconColor || "#c5d49f" }}
                  >
                    {classData.iconEmoji || "📚"}
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
          {lessons.slice(0, 2).map((lesson) => (
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
      </div>
    </div>
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
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {lesson.duration}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Class Activity
              </div>
              {lesson.id === 1 && (
                <div className="flex items-center gap-1">
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
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
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
    if (lesson.id === 1) {
      setLocation("/pre-assessment");
    }
  };

  return (
    <div className="min-h-screen p-4">
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
            {lesson.id === 1 && (
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
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.duration}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Class Activity
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
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
    </div>
  );
}

function LessonSectionsView({ lesson }: { lesson: Lesson }) {
  const sections = [
    { key: 'overview', title: 'Overview', icon: BookOpen, color: 'blue' },
    { key: 'engage', title: 'Engage', icon: Users, color: 'green' },
    { key: 'explore', title: 'Explore', icon: Target, color: 'purple' },
    { key: 'explain', title: 'Explain', icon: ListChecks, color: 'orange' },
    { key: 'elaborate', title: 'Elaborate', icon: CheckCircle, color: 'teal' },
  ];

  return (
    <div className="space-y-6">
      {sections.map(({ key, title, icon: Icon, color }) => {
        const section = lesson.sections[key as keyof typeof lesson.sections];
        const colorClasses = {
          blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950',
          green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950',
          purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950',
          orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950',
          teal: 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950',
        };

        return (
          <Card key={key} className={colorClasses[color as keyof typeof colorClasses]}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Content</h4>
                <ul className="space-y-2">
                  {section.content.map((item, index) => (
                    <li key={index} className="text-sm pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {section.sayStatements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">Key Phrases</h4>
                  <div className="space-y-2">
                    {section.sayStatements.map((statement, index) => (
                      <div key={index} className="bg-green-100 dark:bg-green-900 p-3 rounded border-l-4 border-green-400">
                        <p className="text-sm italic text-green-800 dark:text-green-200">"{statement}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section.activities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">Activities</h4>
                  <ul className="space-y-1">
                    {section.activities.map((activity, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <PlayCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                        <span className="text-sm">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
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
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                <span className="text-sm">{material}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {lesson.id === 1 && (
        <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <FileText className="h-5 w-5" />
              Special Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              This lesson includes a printable pre-assessment worksheet for students to complete.
            </p>
            <Button
              onClick={() => window.open('/pre-assessment', '_blank')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Printer className="h-4 w-4 mr-1" />
              View Worksheet
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}