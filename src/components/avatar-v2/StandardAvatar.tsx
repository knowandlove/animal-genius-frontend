import React from 'react';
import LayeredAvatarRoom from '@/components/avatar-v2/LayeredAvatarRoom';

interface StandardAvatarProps {
  animalType: string;
  items?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  onClick?: () => void;
  className?: string;
  storeCatalog?: any[];
}

/**
 * Standardized avatar component that ensures consistent sizing across all views
 * This should be used everywhere avatars are displayed to ensure positioning is accurate
 */
export default function StandardAvatar({
  animalType,
  items = {},
  size = 'medium',
  animated = true,
  onClick,
  className,
  storeCatalog
}: StandardAvatarProps) {
  // Define consistent sizes for all contexts
  const sizeMap = {
    small: 300,   // For UI elements, thumbnails
    medium: 400,  // For customization views
    large: 504    // For room views
  };
  
  const pixelSize = sizeMap[size];
  
  // IMPORTANT: We don't pass animalScale prop anymore
  // The LayeredAvatarRoom component should handle all scaling internally
  // based on the unified system
  
  return (
    <LayeredAvatarRoom
      animalType={animalType}
      items={items}
      width={pixelSize}
      height={pixelSize}
      animated={animated}
      onClick={onClick}
      className={className}
      storeCatalog={storeCatalog}
      // Removed animalScale prop - let the component use unified scaling
    />
  );
}
