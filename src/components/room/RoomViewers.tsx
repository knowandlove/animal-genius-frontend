import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Viewer {
  id: string;
  name: string;
  joinedAt: Date;
}

interface RoomViewersProps {
  viewers: Viewer[];
  className?: string;
}

export default function RoomViewers({ viewers, className }: RoomViewersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  console.log('RoomViewers component - viewers:', viewers);
  
  if (viewers.length === 0) {
    return null;
  }

  return (
    <div className={cn("absolute top-4 left-4 z-40", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        {/* Viewer indicator button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all",
            "bg-white/90 backdrop-blur-sm border border-gray-200",
            "hover:bg-white hover:shadow-xl"
          )}
        >
          <Eye className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">
            {viewers.length} {viewers.length === 1 ? 'visitor' : 'visitors'}
          </span>
        </button>

        {/* Expanded viewer list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Currently viewing</span>
                </div>
                <div className="space-y-1">
                  {viewers.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="truncate">{viewer.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}