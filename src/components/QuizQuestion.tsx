// QuizQuestion component
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Question as QuizQuestionType } from "@/lib/quiz-questions";

interface QuizQuestionProps {
  question: QuizQuestionType;
  currentQuestion: number;
  totalQuestions: number;
  selectedAnswer?: 'A' | 'B';
  onAnswerSelect: (answer: 'A' | 'B') => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export default function QuizQuestion({
  question,
  currentQuestion,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: QuizQuestionProps) {
  const progressPercent = Math.round((currentQuestion / totalQuestions) * 100);

  const handleSpeakQuestion = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question.text);
      utterance.rate = 0.8;
      utterance.voice = speechSynthesis.getVoices().find(voice => voice.lang.includes('en')) || null;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="bg-white shadow-xl">
        <CardContent className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600">
                Question {currentQuestion} of {totalQuestions}
              </span>
              <span className="text-sm font-semibold text-gray-600">
                {progressPercent}% Complete
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          {/* Question Content */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
              {question.text}
            </h3>
            
            {/* Audio Button - TEMPORARILY DISABLED FOR DEMO */}
            {/* <Button
              variant="secondary"
              onClick={handleSpeakQuestion}
              className="mb-6"
            >
              🔊 Listen to Question
            </Button> */}
          </div>

          {/* Answer Options */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={() => onAnswerSelect('A')}
              className={`w-full text-left p-6 h-auto border-2 transition-all ${
                selectedAnswer === 'A'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-8 h-8 border-2 rounded-full flex items-center justify-center font-bold transition-colors ${
                  selectedAnswer === 'A'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-gray-300 group-hover:border-primary'
                }`}>
                  A
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">
                    {question.options.A}
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => onAnswerSelect('B')}
              className={`w-full text-left p-6 h-auto border-2 transition-all ${
                selectedAnswer === 'B'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-8 h-8 border-2 rounded-full flex items-center justify-center font-bold transition-colors ${
                  selectedAnswer === 'B'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-gray-300 group-hover:border-primary'
                }`}>
                  B
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">
                    {question.options.B}
                  </p>
                </div>
              </div>
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="ghost"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Previous
            </Button>
            
            <Button
              onClick={onNext}
              disabled={!canGoNext}
              size="lg"
            >
              {currentQuestion === totalQuestions ? 'Finish Quiz' : 'Next Question'} →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
