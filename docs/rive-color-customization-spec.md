# Rive Color Customization Specification

**Last Updated:** July 29, 2025
## Animal Genius - Meerkat Avatar

### Overview
We need to modify the meerkat.riv file to support runtime color customization. Students will be able to choose primary and secondary colors for their avatar, and certain areas will automatically use a darker shade of the primary color for depth and detail.

### Color System

We have three color types that need to be applied:

1. **Primary Color** - Main body color (user-selected)
2. **Secondary Color** - Belly, lighter areas (user-selected)  
3. **Primary Dark** - Automatically calculated as 30% darker than primary color

### Required Shape/Path Naming

Please name the shapes/paths in the Rive file according to this specification. Each shape that needs color customization should be named with one of these prefixes:

#### Primary Color Shapes (prefix: `primary_`)
- `primary_body_main` - Main body
- `primary_head` - Head
- `primary_arms` - Arms
- `primary_legs` - Legs
- `primary_tail_base` - Base of the tail (not the tip)
- `primary_outer_ears` - Outer ear shapes

#### Secondary Color Shapes (prefix: `secondary_`)
- `secondary_belly` - Belly/chest area
- `secondary_snout` - Light snout area
- `secondary_inner_limbs` - Inner parts of arms/legs if visible

#### Primary Dark Shapes (prefix: `primaryDark_`)
These will automatically be colored 30% darker than the primary color:
- `primaryDark_eye_patches` - Dark patches around eyes
- `primaryDark_inner_ears` - Inner ear areas
- `primaryDark_tail_tip` - End of the tail
- `primaryDark_shadows` - Any shadow areas that should match primary color

#### Fixed Color Shapes (no prefix needed)
These shapes keep their original colors:
- Eyes (white with black pupils)
- Nose (pink/black)
- Claws (if visible)
- Any other details that shouldn't change color

### Technical Requirements

1. **Solid Fills Only** - Use solid color fills for all customizable areas (no gradients)
2. **Separate Shapes** - Each color zone should be a separate shape/path
3. **Consistent Naming** - Use exact names as specified above
4. **No Nested Groups** - Keep customizable shapes at the top level of the artboard if possible

### Animation Considerations

- Ensure all named shapes remain properly named throughout any animations
- If using bones/deformers, make sure they don't break the shape references
- Test that shapes can be accessed via the Rive runtime API

### Export Settings

When exporting the .riv file:
- Enable "Allow runtime property changes"
- Use the latest Rive format
- Keep file size optimized

### Testing Checklist

- [ ] All primary color areas are named with `primary_` prefix
- [ ] All secondary color areas are named with `secondary_` prefix
- [ ] All darker areas are named with `primaryDark_` prefix
- [ ] Fixed color elements (eyes, nose) are not prefixed
- [ ] Animation plays correctly with shape names intact
- [ ] File exports successfully with runtime modifications enabled

### Example Color Combinations

For testing, try these color combinations:
1. Classic: Primary=#C19A7C, Secondary=#F0D6C2
2. Forest: Primary=#5D4E37, Secondary=#D4A574
3. Desert: Primary=#D4A574, Secondary=#F5DEB3
4. Vibrant: Primary=#FF6B35, Secondary=#FFE5D4

### Visual Reference

Based on our SVG implementation, here's the color mapping:

```
Primary Color:
- Main body
- Head
- Arms/legs
- Outer ears
- Tail base

Secondary Color:
- Belly/chest
- Snout highlight
- Inner limbs

Primary Dark (auto-calculated):
- Eye patches
- Inner ears
- Tail tip
```

### Questions for Designer

1. Are there any additional areas that should change color?
2. Are there any gradient effects that need to be converted to solid fills?
3. Should any animation states (happy, sad, idle) have different color requirements?

### Delivery

Please provide:
1. Updated meerkat.riv file with proper shape naming
2. List of all named shapes for our reference
3. Any notes about limitations or special considerations

---

Once complete, we'll be able to programmatically change colors at runtime using code like:
```javascript
// Colors will be applied to all shapes with matching prefixes
colorTargets={{
  primary: ['primary_body_main', 'primary_head', ...],
  secondary: ['secondary_belly', ...],
  primaryDark: ['primaryDark_eye_patches', ...]
}}
```