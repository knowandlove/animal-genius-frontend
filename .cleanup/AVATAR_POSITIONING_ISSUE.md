# Avatar Positioning Size Mismatch Issue

## Problem
The avatar item positions appear different in the game than in the positioning tool because:

1. **Positioning Tool**:
   - Container: 400x400px
   - Avatar: 300x300px (75% of container)
   - Items positioned relative to 400x400 container

2. **Actual Display (Room)**:
   - Container: 504x504px  
   - Avatar: 504x504px (100% of container)
   - Items positioned relative to full avatar size

3. **Customizer Preview**:
   - Container: 400x400px
   - Avatar: 400x400px (100% of container)

## Why Positions Look Off
When you position an item at 22% from top in the positioning tool:
- It's 22% of 400px = 88px from top
- But the avatar is only 300px tall and centered
- So relative to the avatar, it's actually at a different percentage

## Solutions

### Option 1: Update Positioning Tool (Recommended)
Make the positioning tool show the avatar at 100% of container size, matching the actual display:
- Change LayeredAvatar width/height from 300 to 400 in the tool
- Remove the centering flex container
- This way, what you see is what you get

### Option 2: Recalculate Positions
When loading positions, adjust them based on the size difference:
- For a 75% avatar in 100% container: adjusted_position = 50 + (original_position - 50) * 0.75
- This compensates for the different avatar-to-container ratio

### Option 3: Re-position All Items
Use the current setup but re-position all items in the tool, knowing they'll appear different in the game.

## Current Workaround
For now, you can:
1. Position items in the tool
2. Check how they look in the actual game
3. Adjust positions in the tool until they look right in the game
4. The tool shows a 75% scale preview, but the game shows 100% scale

## Code Changes Needed for Option 1
In `/src/pages/admin/avatar-item-positioner.tsx`:
```tsx
// Change from:
<div className="absolute inset-0 flex items-center justify-center">
  <LayeredAvatar
    animalType={selectedAnimal}
    items={{}}
    width={300}
    height={300}
    animated={false}
  />
</div>

// To:
<div className="absolute inset-0">
  <LayeredAvatar
    animalType={selectedAnimal}
    items={{}}
    width={400}
    height={400}
    animated={false}
  />
</div>
```

And remove the scale multiplication for the preview item.
