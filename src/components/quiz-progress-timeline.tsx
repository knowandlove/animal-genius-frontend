import React from 'react';
import { motion } from 'framer-motion';

interface QuizProgressTimelineProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: number[];
  milestoneQuestions?: number[];
  onQuestionClick?: (questionIndex: number) => void;
  allowNavigation?: boolean;
}

export function QuizProgressTimeline({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  milestoneQuestions = [10, 20, 30],
  onQuestionClick,
  allowNavigation = false
}: QuizProgressTimelineProps) {
  const questions = Array.from({ length: totalQuestions }, (_, i) => i);
  const progressPercentage = (answeredQuestions.length / totalQuestions) * 100;

  const getQuestionStatus = (index: number) => {
    if (answeredQuestions.includes(index)) return 'completed';
    if (index === currentQuestion) return 'current';
    if (index < currentQuestion) return 'available';
    return 'locked';
  };

  const isMilestone = (index: number) => milestoneQuestions.includes(index + 1);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Quiz Progress</h3>
        <div className="text-sm text-gray-600">
          {answeredQuestions.length} of {totalQuestions} completed
        </div>
      </div>
      
      {/* Main Progress Bar */}
      <div className="relative mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-panda-blue to-elephant-mauve h-3 rounded-full"
            style={{ background: 'linear-gradient(to right, hsl(var(--panda-blue)), hsl(var(--elephant-mauve)))' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="absolute right-0 top-4 text-xs text-gray-600">
          {Math.round(progressPercentage)}%
        </div>
      </div>
      
      {/* Question Grid - All Numbers Displayed */}
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(28px, 1fr))' }}>
        {questions.map((index) => {
          const status = getQuestionStatus(index);
          const milestone = isMilestone(index);

          return (
            <motion.button
              key={index}
              onClick={() => allowNavigation && onQuestionClick?.(index)}
              disabled={!allowNavigation || status === 'locked'}
              className={`
                relative flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium
                transition-all duration-200 hover:scale-110
                ${status === 'completed'
                  ? 'text-white' 
                  : status === 'current'
                  ? 'text-white ring-2 ring-blue-300'
                  : status === 'available'
                  ? 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                  : 'bg-gray-200 text-gray-400'
                }
                ${milestone ? 'ring-2 ring-orange-300 text-white' : ''}
                ${allowNavigation && status !== 'locked' ? 'cursor-pointer' : 'cursor-default'}
              `}
              style={{
                backgroundColor: status === 'completed' 
                  ? 'hsl(var(--beaver-forest))' 
                  : status === 'current'
                  ? 'hsl(var(--panda-blue))'
                  : milestone
                  ? 'hsl(var(--otter-peach))'
                  : undefined
              }}
              whileHover={allowNavigation && status !== 'locked' ? { scale: 1.1 } : {}}
              whileTap={allowNavigation && status !== 'locked' ? { scale: 0.95 } : {}}
              title={`Question ${index + 1}${milestone ? ' (Milestone)' : ''}`}
            >
              {milestone ? '★' : index + 1}
            </motion.button>
          );
        })}
      </div>
      
      {/* Simple Legend */}
      <div className="flex gap-4 text-xs text-gray-600 mt-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--beaver-forest))' }}></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--panda-blue))' }}></div>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded flex items-center justify-center text-white text-xs" style={{ backgroundColor: 'hsl(var(--otter-peach))' }}>★</div>
          <span>Milestone</span>
        </div>
      </div>
    </div>
  );
}