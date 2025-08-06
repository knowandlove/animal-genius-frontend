import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shuffle, ArrowRight, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServerAvatar } from './ServerAvatar';
import { ANIMAL_COLOR_PALETTES, getDefaultColors, getRandomColors, type ColorOption } from '@/config/animal-color-palettes';
import confetti from 'canvas-confetti';

interface FirstTimeAvatarCustomizationProps {
  animalType: string;
  studentName: string;
  onComplete: (colors: { primaryColor: string; secondaryColor: string }) => void;
}

export default function FirstTimeAvatarCustomization({
  animalType,
  studentName,
  onComplete
}: FirstTimeAvatarCustomizationProps) {
  const normalizedType = animalType.toLowerCase().replace(/\s+/g, '-');
  const palette = ANIMAL_COLOR_PALETTES[normalizedType] || ANIMAL_COLOR_PALETTES.meerkat;
  
  // Initialize with default colors
  const defaultColors = getDefaultColors(animalType);
  const [selectedPrimary, setSelectedPrimary] = useState(defaultColors.primaryColor);
  const [selectedSecondary, setSelectedSecondary] = useState(defaultColors.secondaryColor);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
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
    // Trigger celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Save colors after a brief delay for celebration
    setTimeout(() => {
      onComplete({
        primaryColor: selectedPrimary,
        secondaryColor: selectedSecondary
      });
    }, 1000);
  };
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-hidden">
      <AnimatePresence mode="wait">
        {!showColorPicker ? (
          // Welcome Screen
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-center max-w-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-6"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome, {studentName}!
              </h1>
              
              <p className="text-2xl text-gray-700 mb-8">
                Your {animalType} avatar is ready to be customized
              </p>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <ServerAvatar
                  animalType={animalType}
                  primaryColor={selectedPrimary}
                  secondaryColor={selectedSecondary}
                  width={300}
                  height={300}
                  animated
                />
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  size="lg"
                  onClick={() => setShowColorPicker(true)}
                  className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Wand2 className="w-5 h-5" />
                  Customize My Avatar
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          // Color Customization Screen
          <motion.div
            key="customize"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
              <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Make Your {animalType} Unique!
                  </h2>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleRandomize}
                      variant="outline"
                      className="gap-2"
                      disabled={isAnimating}
                    >
                      <Shuffle className="w-4 h-4" />
                      Random Colors
                    </Button>
                    <Button
                      onClick={handleComplete}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Sparkles className="w-4 h-4" />
                      I Love It!
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 overflow-auto">
              <div className="max-w-6xl mx-auto p-8">
                <div className="grid lg:grid-cols-2 gap-12">
                  {/* Preview Section */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Live Preview</h3>
                      <p className="text-sm text-gray-500">See your changes instantly!</p>
                    </div>
                    
                    <motion.div
                      animate={{ 
                        scale: isAnimating ? [1, 1.05, 1] : 1,
                        rotate: isAnimating ? [0, -5, 5, 0] : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-pink-200 rounded-3xl blur-2xl opacity-50" />
                      <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
                        <ServerAvatar
                          animalType={animalType}
                          primaryColor={selectedPrimary}
                          secondaryColor={selectedSecondary}
                          width={350}
                          height={350}
                          animated={!isAnimating}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                  
                  {/* Color Selection */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-8"
                  >
                    {/* Primary Color */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600" />
                        <div>
                          <h3 className="text-xl font-semibold">Primary Color</h3>
                          <p className="text-sm text-gray-600">Main body and fur color</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {palette.primary.map((color: ColorOption, index: number) => (
                          <motion.div
                            key={color.value}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                          >
                            <ColorSwatch
                              color={color}
                              isSelected={selectedPrimary === color.value}
                              onClick={() => setSelectedPrimary(color.value)}
                              large
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Secondary Color */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600" />
                        <div>
                          <h3 className="text-xl font-semibold">Secondary Color</h3>
                          <p className="text-sm text-gray-600">Belly, paws, and accent areas</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {palette.secondary.map((color: ColorOption, index: number) => (
                          <motion.div
                            key={color.value}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.05 }}
                          >
                            <ColorSwatch
                              color={color}
                              isSelected={selectedSecondary === color.value}
                              onClick={() => setSelectedSecondary(color.value)}
                              large
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Enhanced Color Swatch Component
interface ColorSwatchProps {
  color: ColorOption;
  isSelected: boolean;
  onClick: () => void;
  large?: boolean;
}

function ColorSwatch({ color, isSelected, onClick, large = false }: ColorSwatchProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative rounded-xl transition-all duration-200 
        ${large ? 'p-3' : 'p-2'}
        ${isSelected 
          ? 'ring-4 ring-purple-500 ring-offset-2 shadow-lg' 
          : 'hover:ring-2 hover:ring-gray-300 hover:shadow-md'
        }
      `}
    >
      <div
        className={`
          ${large ? 'h-16' : 'h-12'} 
          rounded-lg shadow-inner
        `}
        style={{ backgroundColor: color.value }}
      />
      <p className={`
        font-medium mt-2 text-center
        ${large ? 'text-sm' : 'text-xs'}
      `}>
        {color.name}
      </p>
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-1.5 shadow-lg"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}