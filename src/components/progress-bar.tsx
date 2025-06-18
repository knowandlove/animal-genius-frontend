import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
}

export function ProgressBar({ currentQuestion, totalQuestions }: ProgressBarProps) {
  const progressPercent = Math.round((currentQuestion / totalQuestions) * 100);

  return (
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
  );
}
