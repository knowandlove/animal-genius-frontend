# SVG Avatar Color System Documentation

## Overview

The SVG Avatar Color System is a dynamic color customization framework that allows real-time color changes to SVG animal avatars. The system uses a naming convention-based approach where SVG elements with specific ID suffixes automatically receive color updates.

## Table of Contents

1. [Architecture](#architecture)
2. [How It Works](#how-it-works)
3. [Supported Animals](#supported-animals)
4. [Color Palettes](#color-palettes)
5. [Integration Guide](#integration-guide)
6. [SVG Preparation Guide](#svg-preparation-guide)
7. [Code Examples](#code-examples)
8. [Technical Specifications](#technical-specifications)
9. [Best Practices](#best-practices)

## Architecture

### Key Components

1. **SVGAvatar Component** (`/src/components/avatar/SVGAvatar.tsx`)
   - Core React component that loads and colors SVG files
   - Handles dynamic color application using ID suffix convention
   - Provides fallback to PNG images if SVG loading fails

2. **Color Palettes** (`/src/config/animal-color-palettes.ts`)
   - Defines predefined color options for each animal
   - Provides harmonious color combinations
   - Includes helper functions for default and random colors

3. **Color Manipulation Functions**
   - `darkenColor()`: Darkens a color by a specified percentage
   - `lightenColor()`: Lightens a color by a specified percentage

## How It Works

### ID Suffix Naming Convention

The system identifies colorable elements in SVG files by their ID suffixes:

- `_primary` - Elements that should use the primary color
- `_secondary` - Elements that should use the secondary color
- `_primaryDark` - Elements that should use a darkened version of primary (30% darker)
- `_secondaryLight` - Elements that should use a lightened version of secondary (30% lighter)
- `_secondaryDark` - Elements that should use a darkened version of secondary (30% darker)

### Color Application Process

1. SVG file is loaded from `/avatars/animals/{animal_name}.svg`
2. DOMPurify sanitizes the SVG content for security
3. System queries all elements with recognized ID suffixes
4. Colors are applied via both `fill` attribute and inline styles
5. Modified SVG is rendered in the DOM

## Supported Animals

All 8 animals are fully supported with custom color palettes:

1. **Meerkat** - Warm earth tones
2. **Otter** - River and stone colors
3. **Beaver** - Wood and bark shades
4. **Elephant** - Gray variations with pink accents
5. **Parrot** - Vibrant tropical colors
6. **Panda** - Black/white/gray combinations
7. **Owl** - Brown and tan feathers
8. **Collie** - Sable and white variations

## Color Palettes

Each animal has 5-6 color options for both primary and secondary colors:

```typescript
{
  primary: [
    { name: "Original Red", value: "#E66C4F" },
    { name: "Sage Green", value: "#87A96B" },
    // ... more options
  ],
  secondary: [
    { name: "Original Blue", value: "#69759D" },
    { name: "Seafoam", value: "#7BA098" },
    // ... more options
  ]
}
```

All colors within each animal's palette are designed with similar saturation levels for visual harmony.

## Integration Guide

### Basic Usage

```tsx
import { SVGAvatar } from '@/components/avatar/SVGAvatar';

<SVGAvatar
  animalType="parrot"
  primaryColor="#E66C4F"
  secondaryColor="#69759D"
  width={200}
  height={200}
/>
```

### With Color Picker

```tsx
import { getDefaultColors } from '@/config/animal-color-palettes';

const { primaryColor, secondaryColor } = getDefaultColors('parrot');

<SVGAvatar
  animalType={selectedAnimal}
  primaryColor={customPrimaryColor || primaryColor}
  secondaryColor={customSecondaryColor || secondaryColor}
  width={150}
  height={150}
/>
```

### Random Colors

```tsx
import { getRandomColors } from '@/config/animal-color-palettes';

const { primaryColor, secondaryColor } = getRandomColors('owl');
```

## SVG Preparation Guide

### Requirements for New Animal SVGs

1. **File Naming**: Use lowercase with underscores (e.g., `border_collie.svg`)

2. **ID Convention**: Add suffixes to colorable elements:
   ```xml
   <!-- Primary color areas -->
   <path id="body_primary" d="..." />
   <circle id="head_primary" cx="..." />
   
   <!-- Secondary color areas -->
   <path id="belly_secondary" d="..." />
   
   <!-- Shading variations -->
   <path id="shadow_primaryDark" d="..." />
   <path id="highlight_secondaryLight" d="..." />
   <path id="accent_secondaryDark" d="..." />
   ```

3. **Structure Example**:
   ```xml
   <svg viewBox="0 0 200 200">
     <g id="animal_body">
       <path id="main_body_primary" fill="#defaultcolor" d="..." />
       <path id="body_shadow_primaryDark" fill="#defaultdarker" d="..." />
       <circle id="belly_secondary" fill="#defaultlight" cx="..." />
       <path id="belly_highlight_secondaryLight" fill="#defaultlighter" d="..." />
     </g>
   </svg>
   ```

## Code Examples

### Adding a New Animal

1. **Add to Color Palettes**:
```typescript
// In animal-color-palettes.ts
export const ANIMAL_COLOR_PALETTES: Record<string, AnimalColorPalette> = {
  // ... existing animals
  
  fox: {
    primary: [
      { name: "Original Orange", value: "#FF6B35" },
      { name: "Arctic White", value: "#F5F5F5" },
      // ... more colors
    ],
    secondary: [
      { name: "Original White", value: "#FFFFFF" },
      { name: "Cream", value: "#FFF8DC" },
      // ... more colors
    ]
  }
};
```

2. **Prepare SVG File**:
   - Save as `/public/avatars/animals/fox.svg`
   - Add ID suffixes to colorable elements
   - Test with different color combinations

### Custom Color Transformation

```typescript
// For custom shading percentages
const customDarken = (color: string, amount: number): string => {
  return darkenColor(color, amount);
};

// Apply 50% darkening instead of default 30%
const veryDarkPrimary = customDarken(primaryColor, 0.5);
```

## Technical Specifications

### File Structure
```
/src/
  /components/
    /avatar/
      SVGAvatar.tsx         # Main component
  /config/
    animal-color-palettes.ts # Color definitions
/public/
  /avatars/
    /animals/
      meerkat.svg
      otter.svg
      # ... all animal SVGs
```

### Color Format
- All colors use 6-digit hex format: `#RRGGBB`
- No RGB, RGBA, or named colors
- Color manipulation preserves hex format

### Performance Considerations
- SVGs are loaded once and cached by browser
- Color changes are applied via DOM manipulation (no re-fetch)
- DOMPurify sanitization happens only on initial load
- Fallback PNG system for failed SVG loads

### Browser Compatibility
- Supports all modern browsers
- IE11+ with polyfills
- Mobile Safari/Chrome fully supported

## Best Practices

### 1. Color Selection
- Use colors with similar saturation/brightness levels
- Test color combinations for accessibility
- Provide at least 5 options per color slot

### 2. SVG Optimization
- Minimize file size with SVGO
- Use simple paths where possible
- Group related elements
- Remove unnecessary metadata

### 3. Naming Conventions
- Use descriptive IDs: `left_ear_primary` not `path1234`
- Be consistent with suffix capitalization
- Use underscores in IDs, not hyphens

### 4. Testing
- Test all color combinations
- Verify fallback PNG exists
- Check loading states
- Validate on different screen sizes

### 5. Accessibility
- Ensure sufficient contrast
- Test with color blindness simulators
- Provide alternative text descriptions

## Troubleshooting

### Common Issues

1. **Colors not applying**
   - Check ID suffixes are exactly `_primary`, `_secondary`, etc.
   - Verify SVG is loading (check Network tab)
   - Ensure no inline styles override the colors

2. **SVG not loading**
   - Check file path matches animal type
   - Verify file exists in `/public/avatars/animals/`
   - Check browser console for CORS errors

3. **Fallback PNG showing**
   - SVG may have syntax errors
   - DOMPurify might be removing required elements
   - Check if SVG file is corrupted

### Debug Mode

Add console logging to trace issues:
```typescript
console.log(`Found ${primaryIdElements.length} elements with _primary suffix`);
console.log(`Applying color ${primaryColor} to primary elements`);
```

## Future Enhancements

Potential improvements to the system:

1. **Gradient Support**: Add `_primaryGradient` suffix support
2. **Pattern Support**: Allow texture/pattern fills
3. **Animation States**: Color transitions for interactions
4. **Theme Presets**: Save/load complete color themes
5. **Color History**: Undo/redo color changes
6. **Export Feature**: Download customized SVG

## API Reference

### SVGAvatar Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| animalType | string | Yes | - | Animal identifier (e.g., "parrot") |
| primaryColor | string | No | #D4A574 | Hex color for primary elements |
| secondaryColor | string | No | #FFFDD0 | Hex color for secondary elements |
| width | number | Yes | - | Width in pixels |
| height | number | Yes | - | Height in pixels |
| className | string | No | "" | Additional CSS classes |
| onClick | function | No | - | Click handler |
| animated | boolean | No | false | Enable animations (future) |

### Helper Functions

```typescript
getDefaultColors(animalType: string): { 
  primaryColor: string; 
  secondaryColor: string; 
}

getRandomColors(animalType: string): { 
  primaryColor: string; 
  secondaryColor: string; 
}

darkenColor(color: string, amount: number): string
lightenColor(color: string, amount: number): string
```

## Version History

- **v1.0** - Initial 8 animals with basic color support
- **v1.1** - Added _secondaryDark suffix support
- **v1.2** - Harmonized color palettes for all animals

---

Last updated: January 2025