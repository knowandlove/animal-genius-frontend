import { motion } from 'framer-motion';
import { Key, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PassportKeyProps {
  passportCode: string;
  className?: string;
  showAnimation?: boolean;
}

export default function PassportKey({ passportCode, className = '', showAnimation = false }: PassportKeyProps) {
  return (
    <motion.div
      initial={showAnimation ? { scale: 0, rotate: -180 } : {}}
      animate={showAnimation ? { scale: 1, rotate: 0 } : {}}
      transition={{ 
        duration: 0.6, 
        type: "spring",
        stiffness: 260,
        damping: 20 
      }}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <motion.div
        animate={showAnimation ? { 
          rotate: [0, 10, -10, 10, 0],
          scale: [1, 1.1, 1, 1.1, 1]
        } : {}}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
        className="relative"
      >
        <Key className="w-5 h-5 text-yellow-500" />
        <motion.div
          className="absolute inset-0"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Key className="w-5 h-5 text-yellow-400 opacity-50" />
        </motion.div>
      </motion.div>
      
      <Badge 
        variant="secondary" 
        className="font-mono text-sm bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300"
      >
        <Sparkles className="w-3 h-3 mr-1" />
        {passportCode}
      </Badge>
    </motion.div>
  );
}
