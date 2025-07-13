import React, { useEffect, useState, useRef } from 'react';
import { useRive, Layout, Fit, Alignment, RiveState, StateMachineInput } from '@rive-app/react-canvas';

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
  const { RiveComponent, rive } = useRive({
    src: riveUrl,
    stateMachines: "all",
    animations: "all",
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoad: () => {
      console.log('DirectRiveRenderer: Rive loaded');
      onLoad?.();
    },
    onLoadError: (error: any) => {
      console.error('DirectRiveRenderer: Load error:', error);
      onError?.(error);
    },
    onPlay: (event: any) => {
      console.log('DirectRiveRenderer: Play event:', event);
    },
    onPause: (event: any) => {
      console.log('DirectRiveRenderer: Pause event:', event);
    },
    onStop: (event: any) => {
      console.log('DirectRiveRenderer: Stop event:', event);
    },
    onStateChange: (event: any) => {
      console.log('DirectRiveRenderer: State change:', event);
    },
  });

  useEffect(() => {
    console.log('DirectRiveRenderer mounted with URL:', riveUrl);
    console.log('Dimensions:', { width, height });
  }, [riveUrl, width, height]);

  useEffect(() => {
    if (rive) {
      console.log('DirectRiveRenderer: Rive instance available!', rive);
      
      // Try to play the first animation or state machine
      try {
        const stateMachines = rive.stateMachineNames || [];
        const animations = rive.animationNames || [];
        
        if (stateMachines.length > 0) {
          console.log('Playing state machine:', stateMachines[0]);
          rive.play(stateMachines[0]);
        } else if (animations.length > 0) {
          console.log('Playing animation:', animations[0]);
          rive.play(animations[0]);
        }
      } catch (error) {
        console.error('Error playing Rive content:', error);
      }
    }
  }, [rive]);

  return (
    <div style={{
      width,
      height,
      position: 'relative',
      background: 'rgba(255, 0, 255, 0.1)', // Light magenta for visibility
      border: '2px solid magenta',
    }}>
      <RiveComponent style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        top: 2,
        left: 2,
        background: 'white',
        padding: '2px 4px',
        fontSize: '10px',
        fontFamily: 'monospace',
      }}>
        {rive ? 'Rive Active' : 'Loading Rive...'}
      </div>
    </div>
  );
}
