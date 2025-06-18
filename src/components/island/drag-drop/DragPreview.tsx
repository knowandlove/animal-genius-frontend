import React from 'react';
import { motion } from 'framer-motion';
import type { InventoryItem } from '@/stores/islandStore';

interface DragPreviewProps {
  item: InventoryItem;
}

export default function DragPreview({ item }: DragPreviewProps) {
  return (
    <motion.div
      initial={{ scale: 1.1, rotate: 5 }}
      animate={{ scale: 1.15, rotate: 0 }}
      className="pointer-events-none"
    >
      <div className="bg-white rounded-lg shadow-2xl p-4 border-2 border-primary">
        {/* Item Icon */}
        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center mb-2">
          <span className="text-3xl">
            {item.type.includes('furniture') ? '🪑' : 
             item.type.includes('decoration') ? '🪴' : 
             item.type.includes('hat') ? '🎩' : 
             item.type.includes('glasses') ? '👓' : '📦'}
          </span>
        </div>
        
        {/* Item Name */}
        <p className="text-xs font-semibold text-center">{item.name}</p>
        
        {/* Visual feedback */}
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ✓
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
