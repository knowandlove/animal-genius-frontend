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
      { name: "Original Meerkat", value: "#D4B09A" },  // Default - slightly muted
      { name: "Terracotta Dust", value: "#D0A492" },   // Warm reddish-tan
      { name: "Sage Desert", value: "#C4B39C" },       // Green-tinted tan
      { name: "Dusty Mauve", value: "#C7A2A0" },       // Purple-pink tan
      { name: "Storm Sand", value: "#C0AEBB" },        // Blue-tinted tan
      { name: "Golden Sand", value: "#D2B18F" }        // Yellow-tinted tan
    ],
    secondary: [
      { name: "Original Cream", value: "#E8D5C8" },    // Default - more muted
      { name: "Blush Sand", value: "#E5D0C9" },        // Pink-tinted cream
      { name: "Sage Mist", value: "#E2D5C7" },        // Green-tinted cream
      { name: "Lavender Dust", value: "#E3D0CD" },    // Purple-tinted cream
      { name: "Sky Dust", value: "#DFD3D5" },         // Blue-tinted cream
      { name: "Honey Cream", value: "#E6D4C5" }       // Yellow-tinted cream
    ]
  },
  
  otter: {
    primary: [
      { name: "Original Otter", value: "#8B7D6B" },    // Default - more muted brown
      { name: "River Stone", value: "#7F7366" },       // Soft gray-brown
      { name: "Driftwood", value: "#9A8B7A" },        // Light muted brown
      { name: "Wet Sand", value: "#8B8378" },         // Gray-brown blend
      { name: "Moss Rock", value: "#7D7068" },        // Dark muted brown
      { name: "Clay Brown", value: "#A39081" }        // Light clay color
    ],
    secondary: [
      { name: "Original Light", value: "#E8DDD3" },    // Default - softer cream
      { name: "Fog Mist", value: "#DDD5CD" },        // Muted light beige
      { name: "River Foam", value: "#E5DED5" },      // Very soft gray-cream
      { name: "Pebble Gray", value: "#D9D0C7" },     // Light gray-beige
      { name: "Sand Drift", value: "#E0D5C8" },      // Warm muted beige
      { name: "Morning Haze", value: "#DBD3CA" }     // Cool light beige
    ]
  },
  
  beaver: {
    primary: [
      { name: "Original Beaver", value: "#C06638" },   // Default - original SVG color
      { name: "River Stone", value: "#8B7669" },      // Gray-brown like wet river rocks
      { name: "Autumn Bark", value: "#A67C52" },      // Muted orange-brown
      { name: "Deep Earth", value: "#6B4E3D" },       // Dark earthy brown
      { name: "Morning Mist", value: "#9B8B7A" },     // Light taupe-brown
      { name: "Cedar Wood", value: "#7D5A4F" }        // Reddish brown
    ],
    secondary: [
      { name: "Original Tan", value: "#D39979" },      // Default - original SVG color
      { name: "Birch Cream", value: "#E8DDD3" },      // Cool-toned light cream
      { name: "Sandy Shore", value: "#DCC9B6" },      // Muted sandy beige
      { name: "Soft Pebble", value: "#D4C4B0" },      // Grayish tan
      { name: "Wheat Field", value: "#E3D4C1" },      // Warm light tan
      { name: "Driftwood", value: "#C8B8A1" }         // Darker grayish tan
    ]
  },
  
  elephant: {
    primary: [
      { name: "Original Elephant", value: "#A8A8A8" }, // Default - original SVG color
      { name: "Classic Gray", value: "#808080" },
      { name: "Terra Cotta", value: "#8B5A3C" },       // Earthy reddish-brown
      { name: "Slate", value: "#708090" },
      { name: "Stone", value: "#918E85" },
      { name: "Ash Gray", value: "#B2BEB5" }
    ],
    secondary: [
      { name: "Original Pink", value: "#E2C2BB" },     // Default - original SVG color (already pinkish!)
      { name: "Soft Blush", value: "#E8D5D2" },        // Very subtle pink-gray
      { name: "Dusty Rose", value: "#D4B5B0" },        // Muted dusty pink
      { name: "Warm Taupe", value: "#C9ADA7" },        // Pinkish taupe
      { name: "Mushroom Pink", value: "#BFA5A0" },     // Grayish pink
      { name: "Misty Mauve", value: "#D8C8C4" }        // Very pale pinkish gray
    ]
  },
  
  parrot: {
    primary: [
      { name: "Original Red", value: "#E66C4F" },      // Default - soft coral red
      { name: "Sage Green", value: "#87A96B" },        // Muted sage green
      { name: "Dusty Rose", value: "#C08B93" },        // Soft dusty pink
      { name: "Ocean Blue", value: "#5B84B1" },        // Muted ocean blue
      { name: "Goldenrod", value: "#DAA557" },         // Soft golden yellow
      { name: "Terracotta", value: "#CC7A57" }         // Earthy orange
    ],
    secondary: [
      { name: "Original Blue", value: "#69759D" },     // Default - muted purple-blue
      { name: "Seafoam", value: "#7BA098" },           // Soft green-blue
      { name: "Lavender", value: "#9B8AA8" },          // Soft purple
      { name: "Peach", value: "#E4A984" },             // Soft peachy tone
      { name: "Butter", value: "#E3C88A" },            // Soft yellow
      { name: "Dusty Teal", value: "#6B9B9B" }         // Muted teal
    ]
  },
  
  panda: {
    primary: [
      { name: "Original Black", value: "#444444" },    // Default - original SVG color
      { name: "Forest Shadow", value: "#3B4039" },    // Green-tinted dark gray
      { name: "Storm Cloud", value: "#4B5570" },      // Purple-blue gray
      { name: "Ink Black", value: "#1F1F1F" },        // Very dark, almost black
      { name: "Dove Gray", value: "#6B6B6B" },        // Light gray
      { name: "Cocoa Dust", value: "#514843" }        // Brown-tinted gray
    ],
    secondary: [
      { name: "Original Cream", value: "#E5DAD5" },    // Default - original SVG color
      { name: "Bamboo White", value: "#EFF0E8" },     // Greenish white
      { name: "Moonlight", value: "#E9E5F0" },        // Cool lavender white
      { name: "Sand Dollar", value: "#F5EBDD" },      // Warm sandy cream
      { name: "Blossom Pink", value: "#F0DDD7" },     // Soft pink cream
      { name: "Arctic Snow", value: "#F0F3F7" }       // Blue-white, very light
    ]
  },
  
  owl: {
    primary: [
      { name: "Original Bark", value: "#7A4F2D" },     // Default - from SVG
      { name: "Tawny Brown", value: "#8B6F47" },      // Classic owl brown
      { name: "Barn Owl Gray", value: "#6B6056" },    // Soft gray-brown
      { name: "Midnight Feather", value: "#3E3B38" }, // Dark charcoal
      { name: "Autumn Oak", value: "#7D5E48" },       // Warm medium brown
      { name: "Driftwood", value: "#736659" }         // Gray-brown
    ],
    secondary: [
      { name: "Original Sand", value: "#9E7552" },     // Default - from SVG
      { name: "Cream Feather", value: "#D4C4B0" },   // Light cream
      { name: "Buff", value: "#C8AD88" },            // Classic buff color
      { name: "Wheat", value: "#B5A08A" },           // Soft wheat
      { name: "Pale Oak", value: "#BCA589" },        // Light brown
      { name: "Morning Mist", value: "#C7BDB0" }     // Light gray-beige
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
  },
  
  'border-collie': {
    primary: [
      { name: "Original Charcoal", value: "#59554C" },  // Default - from SVG
      { name: "Midnight", value: "#2C2A28" },          // Very dark gray
      { name: "Chocolate", value: "#4A3C36" },         // Soft dark brown
      { name: "Blue Slate", value: "#546B7A" },       // Muted blue-gray
      { name: "Warm Sable", value: "#6B5D54" },       // Warm brown-gray
      { name: "Ash Gray", value: "#6E6B68" }          // Medium gray
    ],
    secondary: [
      { name: "Original Mist", value: "#D7D7D7" },     // Default - from SVG
      { name: "Cloud White", value: "#F0F0F0" },      // Soft white
      { name: "Warm Cream", value: "#E8E4DC" },       // Warm off-white
      { name: "Pearl Gray", value: "#E0DDD8" },       // Light warm gray
      { name: "Oatmeal", value: "#DDD5C7" },          // Light beige
      { name: "Silver Birch", value: "#D4D0CA" }      // Cool light gray
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