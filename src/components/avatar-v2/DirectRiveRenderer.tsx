import React, { useEffect, useState } from 'react';
import { Rive, Layout, Fit, Alignment, RiveState, StateMachineInput } from '@rive-app/react-canvas';

interface DirectRiveRendererProps {
  riveUrl: string;
  width?: number | string;
  height?: number | string;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

export default function DirectRiveRenderer({ 
  riveUrl, 
  width = '100%', 
  height = '100%',
  onLoad,
  onError 
}: DirectRiveRendererProps) {
  const [riveInstance, setRiveInstance] = useState<any>(null);

  useEffect(() => {
    console.log('DirectRiveRenderer mounted with URL:', riveUrl);
    console.log('Dimensions:', { width, height });
  }, [riveUrl, width, height]);

  const handleRiveLoad = (rive: any) => {
    console.log('DirectRiveRenderer: Rive loaded!', {
      rive,
      artboards: rive?.artboardNames,
      animations: rive?.animationNames,
      stateMachines: rive?.stateMachineNames,
    });
    setRiveInstance(rive);
    onLoad?.();
    
    // Try to play the first animation or state machine
    if (rive) {
      if (rive.stateMachineNames && rive.stateMachineNames.length > 0) {
        console.log('Playing state machine:', rive.stateMachineNames[0]);
        rive.play(rive.stateMachineNames[0]);
      } else if (rive.animationNames && rive.animationNames.length > 0) {
        console.log('Playing animation:', rive.animationNames[0]);
        rive.play(rive.animationNames[0]);
      }
    }
  };

  return (
    <div style={{
      width,
      height,
      position: 'relative',
      background: 'rgba(255, 0, 255, 0.1)', // Light magenta for visibility
      border: '2px solid magenta',
    }}>
      <Rive
        src={riveUrl}
        stateMachines="all"
        animations="all"
        layout={
          new Layout({
            fit: Fit.Contain,
            alignment: Alignment.Center,
          })
        }
        onLoad={handleRiveLoad}
        onLoadError={(error) => {
          console.error('DirectRiveRenderer: Load error:', error);
          onError?.(error);
        }}
        onPlay={(event) => {
          console.log('DirectRiveRenderer: Play event:', event);
        }}
        onPause={(event) => {
          console.log('DirectRiveRenderer: Pause event:', event);
        }}
        onStop={(event) => {
          console.log('DirectRiveRenderer: Stop event:', event);
        }}
        onStateChange={(event) => {
          console.log('DirectRiveRenderer: State change:', event);
        }}
      />
      <div style={{
        position: 'absolute',
        top: 2,
        left: 2,
        background: 'white',
        padding: '2px 4px',
        fontSize: '10px',
        fontFamily: 'monospace',
      }}>
        {riveInstance ? 'Rive Active' : 'Loading Rive...'}
      </div>
    </div>
  );
}
