import React from 'react';
import { useRive, UseRiveParameters } from '@rive-app/react-canvas';

interface RiveAnimationProps {
  src: string; // Path to your .riv file
  className?: string;
  autoplay?: boolean;
  animations?: string | string[]; // Animation names to play
  stateMachines?: string | string[]; // State machine names
  enableHover?: boolean; // Enable built-in hover interaction
  hoverInputName?: string; // Name of the hover input in your state machine
  onLoad?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onHoverChange?: (isHovering: boolean) => void;
}

export function RiveAnimation({ 
  src, 
  className = "",
  autoplay = true,
  animations,
  stateMachines,
  enableHover = false,
  hoverInputName = 'hover',
  onLoad,
  onPlay,
  onPause,
  onHoverChange
}: RiveAnimationProps) {
  const [isHovering, setIsHovering] = React.useState(false);
  
  const params: UseRiveParameters = {
    src,
    autoplay,
    animations,
    stateMachines,
    onLoad,
    onPlay,
    onPause,
  };

  const { RiveComponent, rive } = useRive(params);
  
  // Handle hover state changes
  React.useEffect(() => {
    if (enableHover && rive && stateMachines) {
      const stateMachineName = Array.isArray(stateMachines) ? stateMachines[0] : stateMachines;
      const inputs = rive.stateMachineInputs(stateMachineName);
      const hoverInput = inputs?.find(input => input.name === hoverInputName);
      
      if (hoverInput) {
        hoverInput.value = isHovering;
      }
    }
    
    onHoverChange?.(isHovering);
  }, [isHovering, rive, stateMachines, enableHover, hoverInputName, onHoverChange]);
  
  const handleMouseEnter = () => {
    if (enableHover) {
      setIsHovering(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (enableHover) {
      setIsHovering(false);
    }
  };

  return (
    <div 
      className={`rive-container ${className} ${enableHover ? 'cursor-pointer' : ''}`} 
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
    >
      <RiveComponent style={{ backgroundColor: 'transparent' }} />
    </div>
  );
}

// Example usage:
// <RiveAnimation 
//   src="/animations/my-animation.riv" 
//   className="w-full h-64"
//   animations="idle" 
// />
