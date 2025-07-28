export interface ColorOption {
  name: string;
  value: string;
}

export interface AnimalColorPalette {
  primary: ColorOption[];
  secondary: ColorOption[];
}

export const ANIMAL_COLOR_PALETTES: Record<string, AnimalColorPalette> = {
  meerkat: {
    primary: [
      { name: "Original Meerkat", value: "#E8C3A3" },  // Default - original SVG color
      { name: "Sandy", value: "#C19A7C" },
      { name: "Warm Brown", value: "#D3AE91" },
      { name: "Tawny", value: "#CD853F" },
      { name: "Russet", value: "#A0522D" },
      { name: "Dusty Rose", value: "#BC8F8F" }
    ],
    secondary: [
      { name: "Original Cream", value: "#F0D6C2" },    // Default - original SVG color
      { name: "Warm Ivory", value: "#F5E6D3" },
      { name: "Soft Pearl", value: "#EEE0D5" },
      { name: "Desert Sand", value: "#E6DCC2" },
      { name: "Light Cream", value: "#FFF8DC" },
      { name: "Vanilla", value: "#F3E5AB" }
    ]
  },
  
  otter: {
    primary: [
      { name: "Original Otter", value: "#8B6F47" },    // Default - original SVG color
      { name: "River Brown", value: "#654321" },
      { name: "Deep Chocolate", value: "#3B2414" },
      { name: "Chestnut", value: "#954535" },
      { name: "Rustic Brown", value: "#8B4513" },
      { name: "Warm Gray", value: "#696969" }
    ],
    secondary: [
      { name: "Original Light", value: "#F5DEB3" },    // Default - original SVG color
      { name: "Soft Gray", value: "#D3D3D3" },
      { name: "Silver", value: "#C0C0C0" },
      { name: "Pearl White", value: "#FAF0E6" },
      { name: "Light Tan", value: "#D2B48C" },
      { name: "Misty Gray", value: "#BEBEBE" }
    ]
  },
  
  beaver: {
    primary: [
      { name: "Original Beaver", value: "#C06638" },   // Default - original SVG color
      { name: "Warm Chestnut", value: "#954535" },
      { name: "Golden Oak", value: "#B8860B" },
      { name: "Dark Walnut", value: "#5D4037" },
      { name: "Gray Brown", value: "#7B6F63" },
      { name: "Honey", value: "#DEB887" }
    ],
    secondary: [
      { name: "Original Tan", value: "#D39979" },      // Default - original SVG color
      { name: "Cream", value: "#FFF8DC" },
      { name: "Light Tan", value: "#F5DEB3" },
      { name: "Soft Beige", value: "#F5F5DC" },
      { name: "Warm Sand", value: "#F4A460" },
      { name: "Pale Gold", value: "#EEE8AA" }
    ]
  },
  
  elephant: {
    primary: [
      { name: "Original Elephant", value: "#A8A8A8" }, // Default - original SVG color
      { name: "Classic Gray", value: "#808080" },
      { name: "Charcoal", value: "#36454F" },
      { name: "Slate", value: "#708090" },
      { name: "Stone", value: "#918E85" },
      { name: "Ash Gray", value: "#B2BEB5" }
    ],
    secondary: [
      { name: "Original Light", value: "#E8E8E8" },    // Default - original SVG color
      { name: "Light Gray", value: "#D3D3D3" },
      { name: "Silver", value: "#C0C0C0" },
      { name: "Platinum", value: "#E5E4E2" },
      { name: "Dove Gray", value: "#D6D6D6" },
      { name: "Pearl", value: "#F8F8FF" }
    ]
  },
  
  parrot: {
    primary: [
      { name: "Original Red", value: "#FF4444" },      // Default - original SVG color
      { name: "Emerald", value: "#50C878" },
      { name: "Scarlet", value: "#FF2400" },
      { name: "Royal Blue", value: "#4169E1" },
      { name: "Golden Yellow", value: "#FFD700" },
      { name: "Sunset Orange", value: "#FF6347" }
    ],
    secondary: [
      { name: "Original Yellow", value: "#FFD700" },   // Default - original SVG color
      { name: "Lime Green", value: "#32CD32" },
      { name: "Sky Blue", value: "#87CEEB" },
      { name: "Coral", value: "#FF7F50" },
      { name: "Sunshine", value: "#FFFF00" },
      { name: "Turquoise", value: "#40E0D0" }
    ]
  },
  
  panda: {
    primary: [
      { name: "Original Black", value: "#2C2C2C" },    // Default - original SVG color
      { name: "Pure Black", value: "#000000" },
      { name: "Charcoal", value: "#36454F" },
      { name: "Midnight", value: "#191970" },
      { name: "Ebony", value: "#3C3C3C" },
      { name: "Jet Black", value: "#0A0A0A" }
    ],
    secondary: [
      { name: "Original White", value: "#FAFAFA" },    // Default - original SVG color
      { name: "Pure White", value: "#FFFFFF" },
      { name: "Snow", value: "#FFFAFA" },
      { name: "Ivory", value: "#FFFFF0" },
      { name: "Pearl", value: "#FAF0E6" },
      { name: "Cream", value: "#FFFDD0" }
    ]
  },
  
  owl: {
    primary: [
      { name: "Original Owl", value: "#8B7355" },      // Default - original SVG color
      { name: "Barn Brown", value: "#8B6F47" },
      { name: "Tawny", value: "#CD853F" },
      { name: "Rustic Gray", value: "#8A8680" },
      { name: "Forest Brown", value: "#5C4033" },
      { name: "Sandy Brown", value: "#F4A460" }
    ],
    secondary: [
      { name: "Original Buff", value: "#F5E6D3" },     // Default - original SVG color
      { name: "Cream", value: "#FFFDD0" },
      { name: "Buff", value: "#F0DC82" },
      { name: "Light Gray", value: "#D3D3D3" },
      { name: "Ivory", value: "#FFFFF0" },
      { name: "Wheat", value: "#F5DEB3" }
    ]
  },
  
  collie: {
    primary: [
      { name: "Original Sable", value: "#CD853F" },    // Default - original SVG color
      { name: "Sable", value: "#8B6914" },
      { name: "Golden Brown", value: "#B8860B" },
      { name: "Blue Merle", value: "#4682B4" },
      { name: "Tri-Color Black", value: "#000000" },
      { name: "Mahogany", value: "#C04000" }
    ],
    secondary: [
      { name: "Original White", value: "#FFFFFF" },    // Default - original SVG color
      { name: "Cream", value: "#FFFDD0" },
      { name: "Light Tan", value: "#FAEBD7" },
      { name: "Silver", value: "#C0C0C0" },
      { name: "Buff", value: "#F0DC82" }
    ]
  }
};

// Helper function to get default colors for an animal type
export function getDefaultColors(animalType: string): { primaryColor: string; secondaryColor: string } {
  const normalizedType = animalType.toLowerCase().replace(/\s+/g, '-');
  const palette = ANIMAL_COLOR_PALETTES[normalizedType];
  
  if (!palette) {
    // Fallback to original meerkat colors if animal type not found
    return {
      primaryColor: '#E8C3A3',
      secondaryColor: '#F0D6C2'
    };
  }
  
  return {
    primaryColor: palette.primary[0].value,
    secondaryColor: palette.secondary[0].value
  };
}

// Helper function to get random colors for an animal type
export function getRandomColors(animalType: string): { primaryColor: string; secondaryColor: string } {
  const normalizedType = animalType.toLowerCase().replace(/\s+/g, '-');
  const palette = ANIMAL_COLOR_PALETTES[normalizedType];
  
  if (!palette) {
    return getDefaultColors(animalType);
  }
  
  const randomPrimary = palette.primary[Math.floor(Math.random() * palette.primary.length)];
  const randomSecondary = palette.secondary[Math.floor(Math.random() * palette.secondary.length)];
  
  return {
    primaryColor: randomPrimary.value,
    secondaryColor: randomSecondary.value
  };
}