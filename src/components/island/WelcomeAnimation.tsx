import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Sparkles, ChevronRight, Coins, Home, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WelcomeAnimationProps {
  studentName: string;
  animalType: string;
  passportCode: string;
  onComplete: () => void;
}

export default function WelcomeAnimation({ studentName, animalType, passportCode, onComplete }: WelcomeAnimationProps) {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    // Auto-advance through steps
    const timer = setTimeout(() => {
      if (step < 3) {
        setStep(step + 1);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [step]);
  
  const handleSkip = () => {
    localStorage.setItem(`island-welcomed-${passportCode}`, 'true');
    onComplete();
  };
  
  const steps = [
    {
      icon: Key,
      title: "Your Magic Key",
      description: `Welcome ${studentName}! This is your unique passport code.`,
      highlight: passportCode
    },
    {
      icon: Coins,
      title: "Earn Coins",
      description: "Complete quizzes and tasks to earn coins from your teacher!",
      highlight: "50 coins per quiz!"
    },
    {
      icon: ShoppingBag,
      title: "Visit the Store",
      description: "Use your coins to buy cool items for your avatar and room!",
      highlight: "New items weekly!"
    },
    {
      icon: Home,
      title: "Decorate Your Den",
      description: `Make your ${animalType} den unique with furniture and decorations!`,
      highlight: "Let's get started!"
    }
  ];
  
  const currentStep = steps[step];
  const Icon = currentStep.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="max-w-md w-full p-8 relative overflow-hidden">
        {/* Background sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200,
                scale: 0
              }}
              animate={{ 
                scale: [0, 1, 0],
                rotate: 360
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400/50" />
            </motion.div>
          ))}
        </div>
        
        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center relative z-10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20 
              }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full mb-4"
            >
              <Icon className="w-10 h-10 text-amber-600" />
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
            <p className="text-muted-foreground mb-4">{currentStep.description}</p>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-block"
            >
              <div className="bg-gradient-to-r from-yellow-100 to-amber-100 px-4 py-2 rounded-full font-semibold text-amber-900">
                {currentStep.highlight}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8 mb-4">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-amber-500' : 'bg-gray-300'
              }`}
              animate={i === step ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
            />
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>
          
          {step === 3 ? (
            <Button onClick={handleSkip} className="gap-2">
              Start Exploring
              <Sparkles className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(step + 1)}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
