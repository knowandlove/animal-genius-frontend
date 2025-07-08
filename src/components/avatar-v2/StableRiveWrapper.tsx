import React, { useEffect, useState } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

interface StableRiveWrapperProps {
  riveUrl: string;
  style: React.CSSProperties;
  className?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export default function StableRiveWrapper({ 
  riveUrl, 
  style,
  className,
  onMouseDown
}: StableRiveWrapperProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Initialize Rive immediately without waiting for container
  const { RiveComponent, rive } = useRive({
      src: riveUrl,
      animations: 'Timeline 1', // Use animations instead of stateMachines
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
      autoplay: false, // Don't autoplay - we'll control it with hover
      loop: true, // Enable looping
      onLoad: () => {
        console.log('Rive loaded successfully!');
        // Pause immediately on load
        if (rive) {
          rive.pause();
        }
      },
      onLoadError: (error) => {
        console.error('Rive load error:', error);
      },
    }
  );
  
  // Control animation based on hover state
  useEffect(() => {
    if (rive) {
      if (isHovered) {
        console.log('Starting animation loop on hover');
        // Reset to beginning and play
        rive.reset();
        rive.play();
      } else {
        console.log('Stopping animation on mouse leave');
        rive.pause();
        rive.reset(); // Reset to first frame when not hovering
      }
    }
  }, [rive, isHovered]);
  
  return (
    <div 
      ref={containerRef}
      className={className}
      style={{
        ...style,
        overflow: 'hidden',
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {RiveComponent && (
        <RiveComponent 
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block'
          }} 
        />
      )}
    </div>
  );
}
