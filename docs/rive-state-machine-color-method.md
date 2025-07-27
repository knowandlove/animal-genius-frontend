# Rive State Machine Color Method (Reliable Fallback)

If you can't find the Data Binding panel, this State Machine approach is guaranteed to work and gives you predefined color themes.

## How It Works

Instead of passing arbitrary colors from React, you pre-define color variations in Rive and use a Number input to select between them.

## Step-by-Step Implementation

### In Rive Editor:

1. **Set Up Color Keyframes**
   - Select a shape (e.g., `primary_body`)
   - Go to the timeline
   - At frame 0: Set fill to Color Theme 1 (e.g., Sandy: #C19A7C)
   - At frame 10: Set fill to Color Theme 2 (e.g., Forest: #5D4E37)
   - At frame 20: Set fill to Color Theme 3 (e.g., Desert: #D4A574)
   - **Don't create transitions** - just set keyframes

2. **Create State Machine Input**
   - In your State Machine, add a **Number** input
   - Name it: `colorTheme`
   - Set range: 0 to 2 (for 3 themes)

3. **Connect Input to Timeline**
   - In the State Machine, select your animation
   - Find the "Speed" or "Time" property
   - Bind it to the `colorTheme` input
   - Now: colorTheme 0 = frame 0, colorTheme 1 = frame 10, etc.

4. **Repeat for All Color Groups**
   - Do the same for secondary colors at the same frames
   - This keeps all colors synchronized

### In React:

```jsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useState } from 'react';

// Define your color themes
const COLOR_THEMES = [
  { name: 'Sandy', primary: '#C19A7C', secondary: '#F0D6C2' },
  { name: 'Forest', primary: '#5D4E37', secondary: '#8B7355' },
  { name: 'Desert', primary: '#D4A574', secondary: '#F5DEB3' },
];

export default function ThemedMeerkat() {
  const [currentTheme, setCurrentTheme] = useState(0);
  
  const { rive, RiveComponent } = useRive({
    src: '/avatars/animations/meerkat.riv',
    stateMachines: 'State Machine 1', // Your state machine name
    autoplay: true,
  });

  // Get the color theme input
  const colorThemeInput = useStateMachineInput(
    rive, 
    'State Machine 1', 
    'colorTheme'
  );

  // Update theme
  const changeTheme = (themeIndex) => {
    if (colorThemeInput) {
      colorThemeInput.value = themeIndex;
      setCurrentTheme(themeIndex);
    }
  };

  return (
    <div>
      <div style={{ width: 400, height: 400 }}>
        <RiveComponent />
      </div>
      
      <div>
        {COLOR_THEMES.map((theme, index) => (
          <button
            key={theme.name}
            onClick={() => changeTheme(index)}
            style={{
              backgroundColor: theme.primary,
              color: 'white',
              padding: '10px',
              margin: '5px',
              border: currentTheme === index ? '3px solid black' : 'none'
            }}
          >
            {theme.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## Advantages of This Method

1. **Guaranteed to work** - Uses basic Rive features available to all users
2. **Designer control** - Colors are curated in Rive, ensuring good combinations
3. **Smooth transitions** - Can animate between color themes
4. **No UI hunting** - State Machine panel is always visible

## Limitations

- Can't use arbitrary hex colors from a color picker
- Need to pre-define all color variations
- To add new colors, you need to edit the .riv file

## Tips

1. **Create Many Variations**: Set keyframes every 10 frames for up to 10 themes
2. **Use Decimal Values**: Input 0.5 would blend between two themes
3. **Sync All Elements**: Keep primary/secondary colors at same frame numbers
4. **Test Transitions**: You can animate the input value for smooth color morphing

This method is less flexible than Data Binding but is rock-solid reliable and works today!