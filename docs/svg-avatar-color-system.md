# SVG Avatar Color System

This document explains how the SVG avatar color system works in Animal Genius Quiz PRO.

## Overview

The SVG avatar system allows students to customize their animal avatars with different colors. The system uses an ID suffix naming convention to determine which parts of the avatar change color.

## How It Works

### ID Suffix Naming Convention

When creating SVG files for avatars, add suffixes to element IDs to indicate which color they should receive:

- **`_primary`** - Elements that should use the primary color (main body/fur color)
- **`_secondary`** - Elements that should use the secondary color (belly, paws, accent areas)
- **`_primaryDark`** - Elements that should use a darker shade of the primary color (for shading/depth)
- **`_secondaryLight`** - Elements that should use a lighter shade of the secondary color (for highlights/accents)
- **No suffix** - Elements that keep their original color (eyes, nose, fixed features)

### Examples

```xml
<!-- This ear will change to the primary color -->
<path id="leftEar_primary" class="cls-1" d="..."/>

<!-- This belly patch will change to the secondary color -->
<path id="bellyPatch_secondary" class="cls-2" d="..."/>

<!-- This shadow will use a darker primary color -->
<path id="earShadow_primaryDark" class="cls-3" d="..."/>

<!-- This highlight will use a lighter secondary color -->
<path id="neckFur_secondaryLight" class="cls-4" d="..."/>

<!-- This nose will keep its original pink color -->
<path id="nose" class="cls-5" fill="#EC9C93" d="..."/>
```

## Creating New SVG Avatars

1. Design your avatar in Illustrator/Inkscape
2. Name your layers descriptively (e.g., "leftEar", "belly", "tail")
3. Add the appropriate suffix to each layer ID:
   - Main body parts: `_primary`
   - Light/accent areas: `_secondary`
   - Shadows/darker areas: `_primaryDark`
   - Highlights/lighter accents: `_secondaryLight`
   - Leave no suffix for fixed colors (nose, eyes, etc.)
4. Export as SVG
5. Place in `/public/avatars/animals/` directory

## Color Palettes

Each animal has a predefined color palette in `/src/config/animal-color-palettes.ts`. The palette defines available color options for:
- Primary colors (main fur/feather colors)
- Secondary colors (belly, accent colors)

## Technical Implementation

The `SVGAvatar` component (`/src/components/avatar/SVGAvatar.tsx`):
1. Loads the SVG file
2. Parses the SVG content
3. Finds all elements with ID suffixes
4. Applies the selected colors to those elements
5. Leaves elements without suffixes unchanged

The primary dark color is automatically calculated as 30% darker than the primary color.
The secondary light color is automatically calculated as 30% lighter than the secondary color.

## Current Avatar Files

All current SVG avatars use this system:
- `beaver.svg`
- `border_collie.svg`
- `meerkat.svg`
- `panda.svg`

## Tips

- Use descriptive IDs like `leftEar_primary` instead of generic names
- Test your SVG with different color combinations
- Keep the original colors nice for the default view
- Remember that CSS classes (like `cls-1`) are just for styling, not for color changing