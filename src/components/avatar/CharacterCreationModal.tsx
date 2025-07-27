import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shuffle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SVGAvatar } from './SVGAvatar';
import { ANIMAL_COLOR_PALETTES, getDefaultColors, getRandomColors, type ColorOption } from '@/config/animal-color-palettes';

interface CharacterCreationModalProps {
  animalType: string;
  onComplete: (colors: { primaryColor: string; secondaryColor: string }) => void;
  onClose?: () => void;
}

export default function CharacterCreationModal({
  animalType,
  onComplete,
  onClose
}: CharacterCreationModalProps) {
  const normalizedType = animalType.toLowerCase().replace(/\s+/g, '-');
  const palette = ANIMAL_COLOR_PALETTES[normalizedType] || ANIMAL_COLOR_PALETTES.lion;
  
  // Initialize with default colors
  const defaultColors = getDefaultColors(animalType);
  const [selectedPrimary, setSelectedPrimary] = useState(defaultColors.primaryColor);
  const [selectedSecondary, setSelectedSecondary] = useState(defaultColors.secondaryColor);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle randomize with animation
  const handleRandomize = () => {
    setIsAnimating(true);
    const randomColors = getRandomColors(animalType);
    
    // Animate the change
    setTimeout(() => {
      setSelectedPrimary(randomColors.primaryColor);
      setSelectedSecondary(randomColors.secondaryColor);
    }, 150);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };
  
  const handleComplete = () => {
    onComplete({
      primaryColor: selectedPrimary,
      secondaryColor: selectedSecondary
    });
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Card className="w-full max-w-4xl bg-white p-0 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Make Your {animalType} Unique!</h2>
                  <p className="text-purple-100">Choose your colors to create a one-of-a-kind avatar</p>
                </div>
                {onClose && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onClose}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Preview Section */}
                <div className="flex flex-col items-center">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-center mb-2">Preview</h3>
                    <p className="text-sm text-gray-600 text-center">This is how you'll look!</p>
                  </div>
                  
                  <motion.div
                    animate={{ 
                      scale: isAnimating ? [1, 1.05, 1] : 1,
                      rotate: isAnimating ? [0, -5, 5, 0] : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="relative bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 shadow-lg"
                  >
                    <SVGAvatar
                      animalType={animalType}
                      primaryColor={selectedPrimary}
                      secondaryColor={selectedSecondary}
                      width={300}
                      height={300}
                      animated={!isAnimating}
                    />
                  </motion.div>
                  
                  <Button
                    onClick={handleRandomize}
                    variant="outline"
                    className="mt-6 gap-2"
                    disabled={isAnimating}
                  >
                    <Shuffle className="w-4 h-4" />
                    Randomize Colors
                  </Button>
                </div>
                
                {/* Color Selection */}
                <div className="space-y-6">
                  {/* Primary Color */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Primary Color</h3>
                    <p className="text-sm text-gray-600 mb-4">Main fur or feather color</p>
                    <div className="grid grid-cols-3 gap-3">
                      {palette.primary.map((color: ColorOption) => (
                        <ColorSwatch
                          key={color.value}
                          color={color}
                          isSelected={selectedPrimary === color.value}
                          onClick={() => setSelectedPrimary(color.value)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Secondary Color */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Secondary Color</h3>
                    <p className="text-sm text-gray-600 mb-4">Belly, paws, and accent areas</p>
                    <div className="grid grid-cols-3 gap-3">
                      {palette.secondary.map((color: ColorOption) => (
                        <ColorSwatch
                          key={color.value}
                          color={color}
                          isSelected={selectedSecondary === color.value}
                          onClick={() => setSelectedSecondary(color.value)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                {onClose && (
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Customize Later
                  </Button>
                )}
                <Button
                  onClick={handleComplete}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Check className="w-4 h-4" />
                  Looks Good!
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Color Swatch Component
interface ColorSwatchProps {
  color: ColorOption;
  isSelected: boolean;
  onClick: () => void;
}

function ColorSwatch({ color, isSelected, onClick }: ColorSwatchProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative rounded-lg p-2 transition-all duration-200",
        isSelected ? "ring-2 ring-purple-500 ring-offset-2" : "hover:ring-2 hover:ring-gray-300"
      )}
    >
      <div
        className="w-full h-12 rounded-md shadow-sm"
        style={{ backgroundColor: color.value }}
      />
      <p className="text-xs font-medium mt-1 text-center">{color.name}</p>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full p-1"
        >
          <Check className="w-3 h-3" />
        </motion.div>
      )}
    </motion.button>
  );
}

// Helper to ensure import works
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
