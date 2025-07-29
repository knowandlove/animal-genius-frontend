import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Clock, BookOpen, Users, Target, ListChecks } from "lucide-react";
import { lessons, type Lesson } from "@shared/lessons";
import { apiRequest } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useLocation } from "wouter";

export default function TeacherLessons() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("authToken");

  if (!token) {
    setLocation("/login");
    return null;
  }

  const { data: completedLessons = [], isLoading } = useQuery<number[]>({
    queryKey: ["/api/lessons/progress"],
    enabled: !!token,
  });

  const markCompleteMutation = useMutation({
    mutationFn: (lessonId: number) =>
      apiRequest(`/api/lessons/${lessonId}/complete`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons/progress"] });
    },
  });

  const isLessonComplete = (lessonId: number) => {
    return Array.isArray(completedLessons) && completedLessons.includes(lessonId);
  };

  const handleMarkComplete = (lessonId: number) => {
    markCompleteMutation.mutate(lessonId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lesson Plans</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive lesson plans for teaching self-awareness using the Animal Genius Quiz
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation("/learning-lounge")}
              className="flex items-center gap-2"
            >
              ← Back to Learning Lounge
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
            onMarkComplete={() => handleMarkComplete(lesson.id)}
            isMarkingComplete={markCompleteMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface LessonCardProps {
  lesson: Lesson;
  isComplete: boolean;
  onMarkComplete: () => void;
  isMarkingComplete: boolean;
}

function LessonCard({ lesson, isComplete, onMarkComplete, isMarkingComplete }: LessonCardProps) {
  return (
    <Card className={`relative ${isComplete ? 'bg-accent/10 dark:bg-accent/5 border-accent dark:border-accent' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{lesson.title}</CardTitle>
              {isComplete && (
                <Badge variant="default" className="bg-accent hover:bg-accent/80">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
            <CardDescription className="text-base">{lesson.description}</CardDescription>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {lesson.duration}
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                Lesson {lesson.id}
              </div>
            </div>
          </div>
          
          {!isComplete && (
            <Button
              onClick={onMarkComplete}
              disabled={isMarkingComplete}
              variant="outline"
              size="sm"
            >
              {isMarkingComplete ? <LoadingSpinner size="sm" /> : "Complete All"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="objectives">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Learning Objectives
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {lesson.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{objective}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="materials">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Materials Needed
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {lesson.materialsNeeded.map((material, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                    <span className="text-sm">{material}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sections">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lesson Sections
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {Object.entries((lesson as any).sections || {}).map(([key, section]) => (
                  <LessonSection key={key} title={(section as any).title} section={section as any} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

interface LessonSectionProps {
  title: string;
  section: {
    title: string;
    content: string[];
    sayStatements: string[];
    activities: string[];
  };
}

function LessonSection({ title, section }: LessonSectionProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h4 className="font-semibold text-lg text-blue-700 dark:text-blue-400">{section.title}</h4>
      
      <div className="space-y-3">
        <div>
          <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Overview</h5>
          <ul className="space-y-1">
            {section.content.map((item, index) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {section.sayStatements.length > 0 && (
          <div>
            <h5 className="font-medium text-sm text-green-700 dark:text-green-400 mb-2">Key Phrases to Use</h5>
            <div className="space-y-2">
              {section.sayStatements.map((statement, index) => (
                <div key={index} className="bg-green-50 dark:bg-green-950 p-3 rounded border-l-4 border-green-400">
                  <p className="text-sm italic text-green-800 dark:text-green-200">"{statement}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {section.activities.length > 0 && (
          <div>
            <h5 className="font-medium text-sm text-purple-700 dark:text-purple-400 mb-2">Activities</h5>
            <ul className="space-y-1">
              {section.activities.map((activity, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{activity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}