import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Sparkles, Package } from 'lucide-react';
import CropDisplay from './CropDisplay';
import { cn } from '@/lib/utils';
import { useGardenStore } from '@/stores/gardenStore';

interface Crop {
  id: string;
  seedType: string;
  positionX: number;
  positionY: number;
  growthStage: number;
  isHarvested: boolean;
  seed: {
    id: string;
    name: string;
    iconEmoji: string;
    baseGrowthHours: number;
    baseSellPrice: number;
  };
  growthInfo: {
    currentStage: number;
    percentComplete: number;
    isReady: boolean;
    minutesRemaining: number;
  };
  waterBoostUntil: string | null;
}

interface GardenPlotProps {
  plot: {
    id: string;
    gardenTheme: string;
  };
  crops: Crop[];
  canEdit: boolean;
  onPlantSeed?: (x: number, y: number) => void;
  onHarvestCrop?: (cropId: string) => void;
}

const GRID_SIZE = 3;

export default function GardenPlot({ 
  plot, 
  crops, 
  canEdit,
  onPlantSeed,
  onHarvestCrop 
}: GardenPlotProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null);
  
  const isDragging = useGardenStore((state) => state.isDragging);
  const draggedSeed = useGardenStore((state) => state.draggedSeed);
  const stopDragging = useGardenStore((state) => state.stopDragging);
  const plantSeed = useGardenStore((state) => state.plantSeed);

  // Create a map of crops by position
  const cropMap = new Map<string, Crop>();
  crops.forEach(crop => {
    cropMap.set(`${crop.positionX}-${crop.positionY}`, crop);
  });

  const handleCellClick = (x: number, y: number) => {
    if (!canEdit) return;

    const crop = cropMap.get(`${x}-${y}`);
    if (crop) {
      if (crop.growthInfo.isReady && onHarvestCrop) {
        onHarvestCrop(crop.id);
      }
    } else {
      setSelectedCell({ x, y });
      if (onPlantSeed) {
        onPlantSeed(x, y);
      }
    }
  };
  
  const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    if (!canEdit || !isDragging || cropMap.has(`${x}-${y}`)) return;
    setDragOverCell({ x, y });
  };
  
  const handleDragLeave = () => {
    setDragOverCell(null);
  };
  
  const handleDrop = async (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    setDragOverCell(null);
    
    if (!canEdit || !isDragging || !draggedSeed) return;
    
    const crop = cropMap.get(`${x}-${y}`);
    if (!crop) {
      // Plant the seed
      await plantSeed(x, y, draggedSeed.seedType);
    }
    
    stopDragging();
  };

  const hasWaterBoost = crops.some(crop => 
    crop.waterBoostUntil && new Date(crop.waterBoostUntil) > new Date()
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Garden bed background */}
      <div className="relative bg-amber-700/20 rounded-2xl p-8 shadow-inner">
        {/* Water boost indicator */}
        {hasWaterBoost && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            <Droplets className="w-4 h-4" />
            <span>2x Growth Active!</span>
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            const crop = cropMap.get(`${x}-${y}`);
            const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
            const isSelected = selectedCell?.x === x && selectedCell?.y === y;
            const isDragOver = dragOverCell?.x === x && dragOverCell?.y === y;
            const canPlantHere = canEdit && !crop && isDragging;

            return (
              <motion.div
                key={`${x}-${y}`}
                className={cn(
                  "relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32",
                  "bg-amber-900/30 rounded-lg border-2 border-amber-800/40",
                  "cursor-pointer transition-all duration-200",
                  isHovered && "bg-amber-900/40 border-amber-700",
                  isSelected && "ring-2 ring-green-400",
                  crop?.growthInfo.isReady && "animate-pulse",
                  isDragOver && canPlantHere && "bg-green-500/30 border-green-500 scale-105"
                )}
                onMouseEnter={() => setHoveredCell({ x, y })}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => handleCellClick(x, y)}
                onDragOver={(e) => handleDragOver(e, x, y)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, x, y)}
                whileHover={{ scale: canPlantHere ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Soil texture */}
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-amber-800/20 to-amber-900/30" />
                </div>

                {/* Crop or empty state */}
                <AnimatePresence mode="wait">
                  {crop ? (
                    <CropDisplay
                      key={crop.id}
                      crop={crop}
                      canHarvest={canEdit && crop.growthInfo.isReady}
                    />
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {isHovered && canEdit && !isDragging && (
                        <div className="text-amber-600 text-center">
                          <Sparkles className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">Plant here</span>
                        </div>
                      )}
                      {isDragOver && canPlantHere && (
                        <div className="text-green-600 text-center">
                          <Package className="w-8 h-8 mx-auto mb-1 animate-bounce" />
                          <span className="text-xs font-bold">Drop to plant</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Grid position indicator */}
                <div className="absolute bottom-1 right-1 text-xs text-amber-700/50">
                  {x},{y}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}