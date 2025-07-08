import React, { useEffect, useState } from 'react';
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';

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
  const [containerReady, setContainerReady] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Make sure container is ready before initializing Rive
  useEffect(() => {
    if (containerRef.current) {
      setContainerReady(true);
    }
  }, []);
  
  // Initialize Rive with state machine
  const { RiveComponent, rive } = useRive(
    containerReady ? {
      src: riveUrl,
      stateMachines: 'State Machine 1', // Your state machine name
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
      autoplay: true, // State machine will control playback
      onLoad: () => {
        console.log('Rive loaded successfully!');
      },
      onLoadError: (error) => {
        console.error('Rive load error:', error);
      },
    } : null
  );
  
  // Get the hover input from the state machine
  const hoverInput = useStateMachineInput(
    rive,
    'State Machine 1', // Must match your state machine name
    'Hover' // Must match your input name in Rive
  );
  
  return (
    <div 
      ref={containerRef}
      className={className}
      style={{
        ...style,
        overflow: 'hidden',
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => {
        if (hoverInput) {
          hoverInput.value = true;
        }
      }}
      onMouseLeave={() => {
        if (hoverInput) {
          hoverInput.value = false;
        }
      }}
    >
      {containerReady && RiveComponent && (
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
