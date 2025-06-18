import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { questions } from "@shared/quiz-questions";
import { calculateResults } from "@shared/scoring";
import type { QuizAnswer } from "@shared/scoring";

interface TeacherQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (animal: string) => void;
}

export function TeacherQuizModal({ isOpen, onClose, onComplete }: TeacherQuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (selectedAnswer) {
      const newAnswers = [...answers, { questionId: currentQuestion.id, answer: selectedAnswer }];
      setAnswers(newAnswers);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
      } else {
        // Quiz complete, calculate results
        setIsCalculating(true);
        const results = calculateResults(newAnswers);
        setTimeout(() => {
          onComplete(results.animal);
          // Reset modal state
          setCurrentQuestionIndex(0);
          setAnswers([]);
          setSelectedAnswer(null);
          setIsCalculating(false);
        }, 1500);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const previousAnswer = answers[currentQuestionIndex - 1];
      setSelectedAnswer(previousAnswer?.answer || null);
      setAnswers(answers.slice(0, -1));
    }
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setIsCalculating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Discover Your Teaching Animal</DialogTitle>
        </DialogHeader>

        {isCalculating ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Calculating your teaching personality...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">For Teachers</p>
                  <h3 className="text-lg font-medium">{currentQuestion.text}</h3>
                </div>

                <RadioGroup
                  value={selectedAnswer || ""}
                  onValueChange={(value) => setSelectedAnswer(value as 'A' | 'B')}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="A" id="answer-a" />
                      <Label htmlFor="answer-a" className="cursor-pointer flex-1">
                        {currentQuestion.options.A}
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="B" id="answer-b" />
                      <Label htmlFor="answer-b" className="cursor-pointer flex-1">
                        {currentQuestion.options.B}
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedAnswer}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </div>

            {answers.length > 0 && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground"
                >
                  Start Over
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}