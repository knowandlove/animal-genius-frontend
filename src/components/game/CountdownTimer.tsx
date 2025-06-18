import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  timeRemaining: number;
  maxTime: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function CountdownTimer({ 
  timeRemaining, 
  maxTime,
  size = 'md',
  showIcon = true,
  className
}: CountdownTimerProps) {
  const [isLowTime, setIsLowTime] = useState(false);
  
  useEffect(() => {
    setIsLowTime(timeRemaining <= 5 && timeRemaining > 0);
  }, [timeRemaining]);

  const percentage = (timeRemaining / maxTime) * 100;
  
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-4xl'
  };

  const getColor = () => {
    if (timeRemaining <= 5) return 'text-red-500';
    if (timeRemaining <= 10) return 'text-yellow-500';
    return 'text-primary';
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Background circle */}
      <svg className={cn("absolute transform -rotate-90", sizeClasses[size])}>
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-muted"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
          strokeDashoffset={2 * Math.PI * 45 * (1 - percentage / 100)}
          className={getColor()}
          initial={false}
          animate={{
            strokeDashoffset: 2 * Math.PI * 45 * (1 - percentage / 100)
          }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
      </svg>
      
      {/* Timer display */}
      <div className="relative flex flex-col items-center">
        {showIcon && (
          <Timer className={cn("w-4 h-4 mb-1", getColor())} />
        )}
        <motion.span 
          className={cn("font-bold tabular-nums", sizeClasses[size], getColor())}
          animate={isLowTime ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {timeRemaining}
        </motion.span>
      </div>
    </div>
  );
}