import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KalSidebarProps {
  message: string;
  questionProgress: number;
  totalQuestions: number;
}

export function KalSidebar({ message, questionProgress, totalQuestions }: KalSidebarProps) {
  return (
    <div className="hidden lg:flex flex-col h-full">
      <div className="flex-1"></div>
      <div className="relative flex flex-col items-center justify-center p-4 mb-4" style={{ transform: 'translateY(350px)' }}>
        {/* KAL Character Container */}
        <div className="relative mb-8">
          {/* Speech Bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={message}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 z-10"
            >
              <div className="bg-white rounded-2xl shadow-lg px-6 py-4 relative max-w-[280px] border-2 border-gray-100">
                <p className="text-gray-800 text-center font-medium leading-relaxed">
                  {message}
                </p>
                {/* Speech bubble tail */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-gray-100 rotate-45"></div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* KAL Image */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <img 
              src="/images/kal-character.png" 
              alt="KAL Character" 
              className="w-48 h-auto drop-shadow-2xl mt-[0px] mb-[0px]"
            />
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-400/20 to-transparent rounded-full blur-3xl -z-10"></div>
          </motion.div>

          {/* Progress indicator sparkles */}
          {questionProgress > 0 && questionProgress % 5 === 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="absolute -top-4 -right-4"
            >
              <span className="text-4xl">✨</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}