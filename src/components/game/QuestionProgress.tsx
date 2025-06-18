import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuestionProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function QuestionProgress({ current, total, className }: QuestionProgressProps) {
  const percentage = (current / total) * 100;
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Question {current}</span>
        <span>{current} of {total}</span>
      </div>
      
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Question dots */}
        <div className="absolute inset-0 flex items-center justify-around px-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i < current - 1
                  ? "bg-primary scale-75"
                  : i === current - 1
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30 scale-75"
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Milestone celebrations */}
      {current === Math.floor(total / 2) && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-primary mt-2"
        >
          🎉 Halfway there! Keep going!
        </motion.p>
      )}
      
      {current === total - 1 && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-primary mt-2"
        >
          🏁 Last question! Give it your best!
        </motion.p>
      )}
    </div>
  );
}