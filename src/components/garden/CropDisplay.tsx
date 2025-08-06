import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CropDisplayProps {
  crop: {
    id: string;
    seedType: string;
    growthStage: number;
    seed: {
      name: string;
      iconEmoji: string;
      baseSellPrice: number;
    };
    growthInfo: {
      currentStage: number;
      percentComplete: number;
      isReady: boolean;
      minutesRemaining: number;
    };
  };
  canHarvest: boolean;
}

export default function CropDisplay({ crop, canHarvest }: CropDisplayProps) {
  const { seed, growthInfo } = crop;
  
  // Calculate size based on growth stage (0-3)
  const sizes = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
  const currentSize = sizes[Math.min(growthInfo.currentStage, 3)];

  // Format time remaining
  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      {/* Growth progress bar */}
      <div className="absolute top-1 left-1 right-1 h-1 bg-gray-300/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 to-green-600"
          initial={{ width: 0 }}
          animate={{ width: `${growthInfo.percentComplete}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Crop emoji with growth animation */}
      <motion.div
        className={cn(currentSize, "relative")}
        animate={{
          scale: growthInfo.isReady ? [1, 1.1, 1] : 1,
        }}
        transition={{
          repeat: growthInfo.isReady ? Infinity : 0,
          duration: 2,
        }}
      >
        {seed.iconEmoji}
        
        {/* Ready to harvest sparkles */}
        {growthInfo.isReady && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <Sparkles className="w-full h-full text-yellow-400 opacity-50" />
          </motion.div>
        )}
      </motion.div>

      {/* Info overlay */}
      <div className="absolute bottom-1 left-1 right-1 text-center">
        {growthInfo.isReady ? (
          <div className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
            Ready! 🪙{seed.baseSellPrice}
          </div>
        ) : (
          <div className="bg-gray-700/70 text-white text-xs px-2 py-0.5 rounded-full flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeRemaining(growthInfo.minutesRemaining)}
          </div>
        )}
      </div>

      {/* Harvest hint */}
      {growthInfo.isReady && canHarvest && (
        <motion.div
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Click to harvest!
        </motion.div>
      )}
    </motion.div>
  );
}