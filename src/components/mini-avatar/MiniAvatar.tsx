import React from 'react';
import LayeredAvatar from '@/components/avatar-v2/LayeredAvatar';
import { cn } from '@/lib/utils';

interface MiniAvatarProps {
  animalType: string;
  equipped?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  size?: number;
  className?: string;
  showBorder?: boolean;
  showFullBody?: boolean; // Set to true to show full avatar instead of head crop
}

export const MiniAvatar = React.memo(({ 
  animalType, 
  equipped = {}, 
  size = 40,
  className,
  showBorder = true,
  showFullBody = false
}: MiniAvatarProps) => {
  // For mini avatars, we want to show a zoomed-in view of the head
  // This makes the avatar more recognizable at small sizes
  const innerSize = showFullBody ? size : size * 2.5; // Render larger internally for head crop
  const offset = showFullBody ? 0 : size * 0.75; // How much to shift up to focus on head
  
  return (
    <div 
      className={cn(
        "inline-block rounded-full overflow-hidden flex-shrink-0 relative bg-gray-100",
        showBorder && "ring-2 ring-gray-200",
        className
      )}
      style={{ width: size, height: size }}
    >
      {showFullBody ? (
        // Full body mode - simple contained avatar
        <LayeredAvatar
          animalType={animalType}
          items={equipped}
          width={size}
          height={size}
          animated={false}
          className="w-full h-full"
        />
      ) : (
        // Head crop mode - zoomed in view
        <div 
          className="absolute"
          style={{ 
            width: innerSize, 
            height: innerSize,
            top: -offset,
            left: -(innerSize - size) / 2,
          }}
        >
          <LayeredAvatar
            animalType={animalType}
            items={equipped}
            width={innerSize}
            height={innerSize}
            animated={false}
          />
        </div>
      )}
    </div>
  );
});

MiniAvatar.displayName = 'MiniAvatar';
