# Rive View Model Color Customization Guide

## Overview
This guide walks through setting up dynamic color customization using Rive's View Model and Data Binding features (available since 2024).

## Step 1: Create View Model in Rive Editor

### 1.1 Open View Models Panel
- In Rive Editor, go to the **View Models** panel (usually on the right)
- If not visible: **Window → View Models**

### 1.2 Create a New View Model
- Click the **+** button to create a new View Model
- Name it: `AvatarColors`

### 1.3 Add Color Properties
Add these properties to your View Model:

1. **primaryColor** (Type: Color)
   - Default: #C19A7C (or your default meerkat color)
   
2. **secondaryColor** (Type: Color)
   - Default: #F0D6C2

3. **primaryDarkColor** (Type: Color)
   - Default: #947351 (30% darker than primary)
   - Note: We'll calculate this dynamically in React

## Step 2: Bind Shape Fills to View Model Properties

### 2.1 Select Each Shape
For each shape you named (e.g., `primary_body`, `primary_arms`):

1. Select the shape
2. In the **Fill** section of the Inspector
3. Click the **Data Binding** icon (lightning bolt ⚡)
4. Choose **Bind to View Model**
5. Select the appropriate property:
   - Shapes named `primary_*` → Bind to `primaryColor`
   - Shapes named `secondary_*` → Bind to `secondaryColor`
   - Shapes named `primaryDark_*` → Bind to `primaryDarkColor`

### 2.2 Binding Expression (Optional)
If direct binding doesn't work, use an expression:
```
@AvatarColors.primaryColor
```

## Step 3: Export Settings

When exporting your .riv file:
1. **File → Export**
2. Format: `.riv`
3. **IMPORTANT**: Ensure "Include View Models" is checked
4. Runtime: Web/Canvas

## Step 4: React Implementation

### 4.1 Update the ColorCustomizableRiveWrapper Component

```typescript
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

// Helper to darken a color
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

// Convert hex to ARGB format for Rive
const hexToARGB = (hex: string): number => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substr(0, 2), 16);
  const g = parseInt(clean.substr(2, 2), 16);
  const b = parseInt(clean.substr(4, 2), 16);
  // ARGB format: Alpha (255) + RGB
  return (0xFF << 24) | (r << 16) | (g << 8) | b;
};

export default function ColorCustomizableRiveWrapper({ 
  riveUrl, 
  primaryColor = '#C19A7C',
  secondaryColor = '#F0D6C2',
  style,
  className,
  onMouseDown
}: ColorCustomizableRiveWrapperProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const { RiveComponent, rive } = useRive({
    src: riveUrl,
    animations: 'Timeline 1',
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    autoplay: false,
    // CRITICAL: Must be true for View Models
    autoBind: true,
    onLoad: () => {
      console.log('Rive loaded with View Model support');
      if (rive) {
        rive.pause();
        updateColors();
      }
    },
  });
  
  // Function to update colors via View Model
  const updateColors = () => {
    if (!rive?.viewModelInstance) {
      console.log('View Model not yet available');
      return;
    }
    
    const vmi = rive.viewModelInstance;
    console.log('Updating colors via View Model');
    
    try {
      // Update primary color
      const primaryProp = vmi.color('primaryColor');
      if (primaryProp) {
        primaryProp.value = hexToARGB(primaryColor);
        console.log(`Set primaryColor to ${primaryColor}`);
      } else {
        console.warn('primaryColor property not found in View Model');
      }
      
      // Update secondary color
      const secondaryProp = vmi.color('secondaryColor');
      if (secondaryProp) {
        secondaryProp.value = hexToARGB(secondaryColor);
        console.log(`Set secondaryColor to ${secondaryColor}`);
      } else {
        console.warn('secondaryColor property not found in View Model');
      }
      
      // Update primary dark color (calculated from primary)
      const primaryDarkProp = vmi.color('primaryDarkColor');
      if (primaryDarkProp) {
        const darkColor = darkenColor(primaryColor, 0.3);
        primaryDarkProp.value = hexToARGB(darkColor);
        console.log(`Set primaryDarkColor to ${darkColor}`);
      } else {
        console.warn('primaryDarkColor property not found in View Model');
      }
      
    } catch (error) {
      console.error('Error updating colors:', error);
    }
  };
  
  // Update colors when they change
  useEffect(() => {
    if (rive?.viewModelInstance) {
      updateColors();
    }
  }, [rive, primaryColor, secondaryColor]);
  
  // Animation control on hover
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
```

### 4.2 Alternative RGB Method
If the hex conversion doesn't work, you can also set colors using RGB:

```typescript
// Alternative: Set colors using RGB values
const setColorRGB = (colorProp: any, hexColor: string) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  colorProp.rgb(r, g, b);
};

// Usage:
const primaryProp = vmi.color('primaryColor');
if (primaryProp) {
  setColorRGB(primaryProp, primaryColor);
}
```

## Step 5: Testing

1. Export your updated .riv file with View Models
2. Replace the existing meerkat.riv in your project
3. Visit http://localhost:5173/test-rive-colors
4. The color pickers should now update the Rive animation in real-time

## Troubleshooting

### "View Model not found"
- Ensure you exported with "Include View Models" checked
- Check that `autoBind: true` is set in useRive options

### Colors not updating
- Check console for property names - they must match exactly
- Try both `value` (ARGB) and `rgb()` methods
- Ensure shapes are properly bound to View Model properties in Rive

### Animation not playing
- View Models don't affect animation playback
- Check your animation names and autoplay settings

## Benefits of This Approach

1. **Official Support** - This is Rive's recommended method
2. **Real-time Updates** - Colors change instantly
3. **Clean Separation** - Design in Rive, control in code
4. **Future-proof** - Works with Rive's roadmap

## Next Steps

Once this works with meerkat:
1. Apply the same View Model to all animal .riv files
2. Create a library of color presets
3. Add color transitions/animations in Rive
4. Implement the color unlock system