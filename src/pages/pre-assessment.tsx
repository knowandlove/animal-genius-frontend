import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users, Clock, Target, BookOpen, MessageSquare, Printer } from "lucide-react";

const worksheetQuestions = [
  {
    id: 1,
    text: "How well do you think you know yourself?",
    type: "scale",
    instruction: "Circle a number from 1 to 5 (1 = Not very well, 5 = Very well)"
  },
  {
    id: 2,
    text: "When you're upset, how good are you at understanding why you feel that way?",
    type: "scale", 
    instruction: "Circle a number from 1 to 5 (1 = Not good at all, 5 = Very good)"
  },
  {
    id: 3,
    text: "What are some things you're really good at? List at least 3 things:",
    type: "written",
    instruction: "Write your answers in the space below"
  },
  {
    id: 4,
    text: "How confident are you when meeting new people?",
    type: "scale",
    instruction: "Circle a number from 1 to 5 (1 = Not confident, 5 = Very confident)"
  },
  {
    id: 5,
    text: "What's something you'd like to get better at?",
    type: "written",
    instruction: "Write your answer in the space below"
  },
  {
    id: 6,
    text: "How good are you at understanding your feelings?",
    type: "scale",
    instruction: "Circle a number from 1 to 5 (1 = Not good, 5 = Very good)"
  },
  {
    id: 7,
    text: "Describe a time when you felt really proud of yourself:",
    type: "written",
    instruction: "Write 2-3 sentences about this experience"
  },
  {
    id: 8,
    text: "How well do you work with others in a group?",
    type: "scale",
    instruction: "Circle a number from 1 to 5 (1 = Not well, 5 = Very well)"
  }
];

export default function PreAssessment() {
  const [, setLocation] = useLocation();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen p-4 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        {/* Header - Hidden when printing */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button
            variant="ghost"
            onClick={() => setLocation("/learning-lounge")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lessons
          </Button>
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Worksheet
          </Button>
        </div>

        {/* Teacher Overview - Hidden when printing */}
        <Card className="mb-8 print:hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Pre-Assessment Worksheet</CardTitle>
                <CardDescription>Printable self-awareness baseline assessment for students</CardDescription>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                15-20 minutes
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Individual
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Written Assessment
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Instructions for Teachers</h3>
              <ul className="space-y-2 text-blue-700 dark:text-blue-300 text-sm">
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Print one worksheet for each student</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Emphasize there are no right or wrong answers</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Allow 15-20 minutes for completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Collect worksheets to track student growth over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Use as a baseline before taking the Animal Genius Quiz</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Printable Worksheet */}
        <div className="bg-white p-8 rounded-lg shadow-lg print:shadow-none print:rounded-none">
          {/* Worksheet Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Self-Awareness Pre-Assessment</h1>
            <p className="text-gray-600 mb-6">Take your time and answer honestly. There are no right or wrong answers!</p>
            
            <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-8">
              <div className="flex items-center gap-4">
                <span className="font-medium">Name:</span>
                <div className="border-b border-gray-400 w-48 h-6"></div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">Date:</span>
                <div className="border-b border-gray-400 w-32 h-6"></div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">Grade:</span>
                <div className="border-b border-gray-400 w-24 h-6"></div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-8">
            {worksheetQuestions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start gap-3 mb-4">
                  <span className="font-bold text-lg text-gray-700 min-w-[2rem]">{index + 1}.</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 mb-2">{question.text}</h3>
                    <p className="text-sm text-gray-600 italic mb-4">{question.instruction}</p>
                    
                    {question.type === 'scale' && (
                      <div className="flex items-center gap-8">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <div key={num} className="flex flex-col items-center">
                            <div className="w-6 h-6 border-2 border-gray-400 rounded-full mb-1"></div>
                            <span className="text-sm font-medium">{num}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'written' && (
                      <div className="space-y-3">
                        <div className="border-b border-gray-400 h-6"></div>
                        <div className="border-b border-gray-400 h-6"></div>
                        <div className="border-b border-gray-400 h-6"></div>
                        {question.id === 3 && (
                          <>
                            <div className="border-b border-gray-400 h-6"></div>
                            <div className="border-b border-gray-400 h-6"></div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300">
            <div className="text-center text-gray-600">
              <p className="text-sm">Thank you for completing this assessment!</p>
              <p className="text-sm">Your teacher will use this to help track your growth in self-awareness.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}