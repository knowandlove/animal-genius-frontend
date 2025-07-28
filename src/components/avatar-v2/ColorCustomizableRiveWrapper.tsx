import React, { useEffect, useState } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

interface ColorCustomizableRiveWrapperProps {
  riveUrl: string;
  primaryColor?: string;
  secondaryColor?: string;
  style: React.CSSProperties;
  className?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
}

// Helper function to darken a color
const darkenColor = (color: string, amount: number = 0.3): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const newR = Math.round(r * (1 - amount));
  const newG = Math.round(g * (1 - amount));
  const newB = Math.round(b * (1 - amount));
  
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};


export default function ColorCustomizableRiveWrapper({ 
  riveUrl, 
  primaryColor = '#D4A574',
  secondaryColor = '#FFFDD0',
  style,
  className,
  onMouseDown
}: ColorCustomizableRiveWrapperProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const { RiveComponent, rive } = useRive({
    src: riveUrl,
    animations: 'Timeline 1',
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    autoplay: false,
    // CRITICAL: Must be true for View Models to work
    autoBind: true,
    onLoad: () => {
      console.log('Rive loaded with View Model support');
      if (rive) {
        rive.pause();
        // Apply colors after load
        applyCustomColors();
      }
    },
    onLoadError: (error) => {
      console.error('Rive load error:', error);
    },
  });
  
  // Function to apply custom colors via View Model
  const applyCustomColors = () => {
    if (!rive) {
      console.log('Rive not yet available');
      return;
    }
    
    // Get the default view model from the file
    const viewModel = rive.defaultViewModel();
    if (!viewModel) {
      console.log('No default View Model found in file');
      return;
    }
    
    // Get or create the view model instance
    let vmi = rive.viewModelInstance;
    if (!vmi) {
      console.log('Creating new View Model instance');
      vmi = viewModel.defaultInstance();
      // View model instance is set automatically when created
      
      // Binding happens automatically in newer Rive versions
    }
    
    console.log('Updating colors via View Model');
    console.log('View Model:', viewModel);
    console.log('View Model Instance:', vmi);
    
    // Debug: List all properties in the View Model
    console.log('Checking View Model properties...');
    if (vmi) {
      try {
        const testPrimary = vmi.color('primaryColor');
        console.log('primaryColor property exists:', !!testPrimary);
        const testSecondary = vmi.color('secondaryColor');
        console.log('secondaryColor property exists:', !!testSecondary);
        const testPrimaryDark = vmi.color('primaryDarkColor');
        console.log('primaryDarkColor property exists:', !!testPrimaryDark);
      } catch (e) {
        console.error('Error checking properties:', e);
      }
    }
    
    try {
      // Helper to convert hex to RGB and set color
      const setColorFromHex = (colorProp: any, hexColor: string, propName: string) => {
        if (!colorProp) {
          console.warn(`${propName} property not found in View Model`);
          return;
        }
        
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Use the rgb() method from the documentation
        colorProp.rgb(r, g, b);
        console.log(`Set ${propName} to ${hexColor} (RGB: ${r}, ${g}, ${b})`);
        
        // Debug: Let's check the actual value after setting
        console.log(`${propName} value after setting:`, colorProp.value);
      };
      
      // Update all three colors
      if (vmi) {
        const primaryProp = vmi.color('primaryColor');
        setColorFromHex(primaryProp, primaryColor, 'primaryColor');
        
        const secondaryProp = vmi.color('secondaryColor');
        setColorFromHex(secondaryProp, secondaryColor, 'secondaryColor');
        
        const primaryDarkProp = vmi.color('primaryDarkColor');
        const darkColor = darkenColor(primaryColor, 0.3);
        setColorFromHex(primaryDarkProp, darkColor, 'primaryDarkColor');
      }
      
      // Force update by triggering a re-render
      
      // Alternative: Force a full re-render by play/pause
      if (rive) {
        rive.play();
        setTimeout(() => {
          rive.pause();
          console.log('Forced re-render with play/pause');
        }, 10);
      }
      
    } catch (error) {
      console.error('Error updating colors:', error);
    }
  };
  
  // Reapply colors when they change
  useEffect(() => {
    if (rive) {
      applyCustomColors();
    }
  }, [rive, primaryColor, secondaryColor]);
  
  // Control animation based on hover state
  useEffect(() => {
    if (rive) {
      if (isHovered) {
        rive.reset();
        rive.play();
      } else {
        rive.pause();
        rive.reset();
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