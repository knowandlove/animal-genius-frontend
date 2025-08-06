import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Save, Check } from 'lucide-react';
import { SVGAvatar } from '@/components/avatar/SVGAvatar';
import AvatarCustomizerView from './AvatarCustomizerView';
import { useRoomStore } from '@/stores/roomStore';
// Removed avatarStore - using roomStore for all avatar state
import { getAssetUrl } from '@/utils/cloud-assets';
import { getDefaultColors } from '@/config/animal-color-palettes';

interface FullScreenAvatarCustomizerProps {
  student: any;
  onClose: () => void;
  onSave: (equipped: any) => void;
  onColorChange: (colors: { primaryColor: string; secondaryColor: string }) => void;
  inventoryData?: any;
}

export default function FullScreenAvatarCustomizer({
  student,
  onClose,
  onSave,
  onColorChange,
  inventoryData
}: FullScreenAvatarCustomizerProps) {
  const draftAvatar = useRoomStore((state) => state.draftAvatar);
  
  // Get colors from room store's avatar state or use defaults
  const avatarColors = useRoomStore((state) => state.avatar.colors);
  const animalDefaults = getDefaultColors(student?.animalType || 'meerkat');
  const defaultColors = {
    primaryColor: student?.avatarData?.colors?.primaryColor || animalDefaults.primaryColor,
    secondaryColor: student?.avatarData?.colors?.secondaryColor || animalDefaults.secondaryColor,
    hasCustomized: student?.avatarData?.colors?.hasCustomized || false
  };
  
  const [currentColors, setCurrentColors] = useState(() => {
    // Ensure we always have both colors, even if one is missing
    return {
      primaryColor: avatarColors?.primaryColor || defaultColors.primaryColor,
      secondaryColor: avatarColors?.secondaryColor || defaultColors.secondaryColor,
      hasCustomized: avatarColors?.hasCustomized || defaultColors.hasCustomized
    };
  });
  
  const handleColorChange = (colors: { primaryColor: string; secondaryColor: string }) => {
    setCurrentColors({ ...colors, hasCustomized: true });
    // Update room store's avatar colors for real-time preview
    useRoomStore.getState().setAvatarColors({ ...colors, hasCustomized: true });
    onColorChange(colors);
  };
  
  const handleSaveAndClose = () => {
    // Save both colors and equipped items
    onSave({ 
      equipped: draftAvatar?.equipped || {},
      colors: currentColors
    });
    onClose();
  };
  
  // Fixed avatar dimensions that won't change when switching tabs
  const AVATAR_WIDTH = 350;
  const AVATAR_HEIGHT = 450;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-xl shadow-2xl flex flex-col max-w-6xl w-full max-h-[90vh]"
      >
        {/* Header with title and buttons */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-2xl font-bold text-gray-800">
            Customize Your Avatar
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveAndClose}
              variant="default"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Save & Close
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left side - Avatar Preview with fixed size container */}
          <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="relative flex flex-col items-center">
              {/* Fixed size container for avatar to prevent size changes */}
              <div style={{ width: AVATAR_WIDTH, height: AVATAR_HEIGHT }} className="flex items-center justify-center">
                {/* Always use SVGAvatar for consistency */}
                <SVGAvatar
                  animalType={student?.animalType || 'meerkat'}
                  width={AVATAR_WIDTH}
                  height={AVATAR_HEIGHT}
                  primaryColor={currentColors.primaryColor || animalDefaults.primaryColor}
                  secondaryColor={currentColors.secondaryColor || animalDefaults.secondaryColor}
                  items={draftAvatar?.equipped || student?.avatarData?.equipped || {}}
                  animated
                />
              </div>
              
              {/* Info text below avatar */}
              <p className="text-gray-600 text-center mt-4">
                Click items to equip or unequip them
              </p>
              <p className="text-gray-500 text-xs text-center mt-1">
                Remember to click "Save & Close" when done
              </p>
            </div>
          </div>
          
          {/* Right side - Inventory and customization panel */}
          <div className="w-[400px] bg-white shadow-xl flex flex-col border-l h-full">
            <div className="flex-1 min-h-0 overflow-hidden">
              <AvatarCustomizerView 
                isMobile={false}
                storeCatalog={inventoryData?.storeCatalog || []}
                onColorChange={handleColorChange}
                animalType={student?.animalType}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}