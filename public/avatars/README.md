# Avatar Assets Structure

This folder contains all the PNG images for the avatar system.

## Directory Structure

```
avatars/
├── animals/          # Base animal images
│   ├── beaver.png
│   ├── dolphin.png
│   ├── elephant.png
│   ├── owl.png
│   ├── cheetah.png
│   ├── otter.png
│   ├── parrot.png
│   └── border-collie.png
│
└── items/           # Equipable items
    ├── hats/
    │   ├── wizard_hat.png
    │   ├── crown.png
    │   └── cap.png
    │
    ├── glasses/
    │   ├── glasses.png
    │   └── sunglasses.png
    │
    └── accessories/
        ├── bow_tie.png
        └── necklace.png
```

## Image Requirements

- **Format**: PNG with transparent background
- **Size**: 512x512px recommended
- **Base Animals**: Should be centered, facing forward
- **Items**: Should be positioned as they would appear on the animal
- **File names**: Must match the IDs used in the code (case-sensitive)

## Adding New Items

1. Create the PNG with transparent background
2. Place in the appropriate subfolder
3. Add the item configuration to `LayeredAvatar.tsx`
4. Add to store catalog in `shared/currency-types.ts`

## Testing

Visit `/avatar-test-v2` to see the avatar system in action.
