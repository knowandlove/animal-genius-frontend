import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Droplets, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface WateringControlsProps {
  onWater: () => Promise<void>;
  cooldownMinutes: number;
  isWatering: boolean;
}

export default function WateringControls({ 
  onWater, 
  cooldownMinutes, 
  isWatering 
}: WateringControlsProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(cooldownMinutes);

  useEffect(() => {
    setTimeRemaining(cooldownMinutes);
  }, [cooldownMinutes]);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev - 1;
        return next <= 0 ? 0 : next;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleWater = async () => {
    setShowAnimation(true);
    await onWater();
    setTimeout(() => setShowAnimation(false), 2000);
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const isOnCooldown = timeRemaining > 0;

  return (
    <>
      <Button
        size="sm"
        variant={isOnCooldown ? "secondary" : "default"}
        onClick={handleWater}
        disabled={isOnCooldown || isWatering}
        className={cn(
          "gap-1 relative overflow-hidden",
          isOnCooldown && "opacity-75"
        )}
      >
        <Droplets className="h-4 w-4" />
        {isOnCooldown ? (
          <>
            <Clock className="h-3 w-3" />
            {formatTime(timeRemaining)}
          </>
        ) : (
          "Water All"
        )}
        
        {isWatering && (
          <motion.div
            className="absolute inset-0 bg-blue-400/30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          />
        )}
      </Button>

      {/* Water animation overlay */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {/* Water droplets */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-blue-500"
                initial={{ 
                  top: "-10%",
                  left: `${Math.random() * 100}%`,
                  opacity: 0 
                }}
                animate={{ 
                  top: "110%",
                  opacity: [0, 1, 1, 0] 
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "linear"
                }}
              >
                <Droplets className="h-8 w-8" />
              </motion.div>
            ))}

            {/* Success message */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg text-lg font-bold">
                All Gardens Watered! 💧
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}