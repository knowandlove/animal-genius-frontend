import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FishbowlPlaceholderProps {
  size?: number;
  onClick?: () => void;
  stats?: {
    hunger: number;
    happiness: number;
  };
  petName?: string;
}

export default function FishbowlPlaceholder({ size = 80, onClick, stats, petName }: FishbowlPlaceholderProps) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      className="relative cursor-pointer hover:scale-105 transition-transform"
      style={{ width: size, height: size }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Fishbowl */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bowl */}
        <ellipse
          cx="50"
          cy="55"
          rx="35"
          ry="40"
          fill="#E0F2FE"
          stroke="#0EA5E9"
          strokeWidth="2"
        />
        
        {/* Water line */}
        <ellipse
          cx="50"
          cy="30"
          rx="30"
          ry="5"
          fill="#60A5FA"
          opacity="0.4"
        />
        
        {/* Simple fish */}
        <g transform="translate(50, 55)">
          {/* Fish body */}
          <ellipse
            cx="0"
            cy="0"
            rx="8"
            ry="5"
            fill="#F97316"
            transform="rotate(-10)"
          />
          
          {/* Fish tail */}
          <path
            d="M 6 0 L 12 -3 L 12 3 Z"
            fill="#F97316"
          />
          
          {/* Fish eye */}
          <circle
            cx="-3"
            cy="-1"
            r="1.5"
            fill="#000000"
          />
        </g>
        
        {/* Bubbles */}
        <circle cx="60" cy="40" r="2" fill="#ffffff" opacity="0.6" />
        <circle cx="40" cy="45" r="1.5" fill="#ffffff" opacity="0.6" />
        <circle cx="55" cy="50" r="1" fill="#ffffff" opacity="0.6" />
        
        {/* Glass reflection */}
        <ellipse
          cx="35"
          cy="40"
          rx="8"
          ry="15"
          fill="#ffffff"
          opacity="0.3"
        />
      </svg>
      
      {/* Hover tooltip with stats */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-2 rounded-lg pointer-events-none whitespace-nowrap z-50"
          >
            {stats ? (
              <div className="space-y-1">
                <div className="font-semibold text-center">{petName || 'Fish'}</div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span>🍔</span>
                    <span className={stats.hunger > 70 ? 'text-green-400' : stats.hunger > 30 ? 'text-yellow-400' : 'text-red-400'}>
                      {Math.round(stats.hunger)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>😊</span>
                    <span className={stats.happiness > 70 ? 'text-green-400' : stats.happiness > 30 ? 'text-yellow-400' : 'text-red-400'}>
                      {Math.round(stats.happiness)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>Click to view fish</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}