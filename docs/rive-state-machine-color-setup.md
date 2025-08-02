# Rive State Machine Color Customization Setup

**Last Updated:** July 29, 2025

Since direct runtime color manipulation isn't well-documented in Rive's React runtime, we'll use State Machines for color customization.

## State Machine Approach

### Step 1: Create Color Inputs in Rive

1. In your Rive file, create a new **State Machine** called `ColorCustomizer`
2. Add three **Number inputs**:
   - `primaryHue` (0-360) - Controls the hue of primary color
   - `primarySaturation` (0-100) - Controls saturation
   - `primaryLightness` (0-100) - Controls lightness
   - `secondaryHue` (0-360)
   - `secondarySaturation` (0-100)
   - `secondaryLightness` (0-100)

### Step 2: Create Color States

1. Create multiple states for different color combinations
2. Or use **Blend States** to interpolate between colors based on input values

### Step 3: Bind Colors to Inputs

1. Select each shape (e.g., `primary_body`)
2. In the fill color property, click the **Data Binding** icon (looks like a lightning bolt)
3. Create an expression that converts HSL inputs to color:
   ```
   hsl(primaryHue, primarySaturation%, primaryLightness%)
   ```

### Alternative: Predefined Color Sets

If HSL conversion isn't supported, create predefined color states:

1. Create states for each color palette:
   - `State_Sandy` (primary: #C19A7C, secondary: #F0D6C2)
   - `State_Forest` (primary: #5D4E37, secondary: #D4A574)
   - `State_Desert` (primary: #D4A574, secondary: #F5DEB3)

2. Use a number input `colorPalette` (0-3) to blend between states

### Step 4: Export Settings

When exporting:
- Format: `.riv`
- Include: State Machines
- Runtime: Web/Canvas

## React Implementation

```typescript
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

function ColorCustomizableRiveAvatar({ primaryColor, secondaryColor }) {
  const { rive, RiveComponent } = useRive({
    src: '/avatars/animations/meerkat.riv',
    stateMachines: 'ColorCustomizer',
    autoplay: true,
  });

  // Get state machine inputs
  const primaryHueInput = useStateMachineInput(rive, 'ColorCustomizer', 'primaryHue');
  const primarySatInput = useStateMachineInput(rive, 'ColorCustomizer', 'primarySaturation');
  const primaryLightInput = useStateMachineInput(rive, 'ColorCustomizer', 'primaryLightness');

  // Convert hex to HSL and update inputs
  useEffect(() => {
    if (primaryHueInput && primarySatInput && primaryLightInput) {
      const hsl = hexToHSL(primaryColor);
      primaryHueInput.value = hsl.h;
      primarySatInput.value = hsl.s;
      primaryLightInput.value = hsl.l;
    }
  }, [primaryColor, primaryHueInput, primarySatInput, primaryLightInput]);

  return <RiveComponent />;
}
```

## Benefits of State Machine Approach

1. **Officially Supported** - This is Rive's recommended way
2. **Smooth Transitions** - Can animate between color changes
3. **More Control** - Can add easing, delays, and complex color logic
4. **Designer-Friendly** - Designers can preview all color variations in Rive

## Quick Test Method

For testing if your current Rive file supports any runtime modifications:

1. Add a simple State Machine with one number input called `test`
2. Bind something visible to it (like rotation or scale)
3. See if you can control it from React using `useStateMachineInput`
4. If that works, proceed with the color binding approach