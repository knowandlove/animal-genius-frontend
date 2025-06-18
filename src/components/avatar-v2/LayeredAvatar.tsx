import React, { useState, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface AvatarLayer {
  id: string;
  src?: string; // URL to PNG image
  emoji?: string; // Fallback emoji
  zIndex: number;
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  scale?: number;
  rotation?: number;
}

interface LayeredAvatarProps {
  animalType: string;
  width?: number;
  height?: number;
  items?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  onClick?: () => void;
  className?: string;
  animated?: boolean;
}

// Emoji fallbacks for when images aren't loaded yet
const animalEmojis: Record<string, string> = {
  beaver: '🦫',
  dolphin: '🐬',
  elephant: '🐘',
  owl: '🦉',
  cheetah: '🐆',
  otter: '🦦',
  parrot: '🦜',
  'border collie': '🐕',
  meerkat: '🦫', // Using otter emoji as closest match
  panda: '🐼',
};

// Animal-specific adjustments for item positioning
type ItemAdjustment = {
  top: string;
  left: string;
  scale: number;
  rotation: number;
};

type AnimalAdjustments = {
  [animal: string]: {
    hat: {
      [itemId: string]: ItemAdjustment;
    };
    glasses: {
      [itemId: string]: ItemAdjustment;
    };
    accessory: {
      [itemId: string]: ItemAdjustment;
    };
  };
};

// Position Adjustments - Generated from Avatar Editor  
const animalAdjustments: AnimalAdjustments = {
  "beaver": {
    "hat": {
      "explorer": {
        "top": "15%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "safari": {
        "top": "10%",
        "left": "50%",
        "scale": 0.45,
        "rotation": 0
      }
    },
    "glasses": {
      "greenblinds": {
        "top": "40%",
        "left": "50%",
        "scale": 0.35,
        "rotation": 0
      },
      "hearts": {
        "top": "40%",
        "left": "50%",
        "scale": 0.4,
        "rotation": 0
      }
    },
    "accessory": {
      "bow_tie": {
        "top": "65%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "necklace": {
        "top": "60%",
        "left": "50%",
        "scale": 0.55,
        "rotation": 0
      }
    }
  },
  "panda": {
    "hat": {
      "explorer": {
        "top": "15%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "safari": {
        "top": "10%",
        "left": "50%",
        "scale": 0.45,
        "rotation": 0
      }
    },
    "glasses": {
      "greenblinds": {
        "top": "40%",
        "left": "50%",
        "scale": 0.35,
        "rotation": 0
      },
      "hearts": {
        "top": "40%",
        "left": "50%",
        "scale": 0.4,
        "rotation": 0
      }
    },
    "accessory": {
      "bow_tie": {
        "top": "65%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "necklace": {
        "top": "60%",
        "left": "50%",
        "scale": 0.55,
        "rotation": 0
      }
    }
  },
  "elephant": {
    "hat": {
      "explorer": {
        "top": "15%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "safari": {
        "top": "10%",
        "left": "50%",
        "scale": 0.45,
        "rotation": 0
      }
    },
    "glasses": {
      "greenblinds": {
        "top": "40%",
        "left": "50%",
        "scale": 0.35,
        "rotation": 0
      },
      "hearts": {
        "top": "40%",
        "left": "50%",
        "scale": 0.4,
        "rotation": 0
      }
    },
    "accessory": {
      "bow_tie": {
        "top": "65%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "necklace": {
        "top": "60%",
        "left": "50%",
        "scale": 0.55,
        "rotation": 0
      }
    }
  },
  "owl": {
    "hat": {
      "explorer": {
        "top": "15%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "safari": {
        "top": "10%",
        "left": "50%",
        "scale": 0.45,
        "rotation": 0
      }
    },
    "glasses": {
      "greenblinds": {
        "top": "40%",
        "left": "50%",
        "scale": 0.35,
        "rotation": 0
      },
      "hearts": {
        "top": "40%",
        "left": "50%",
        "scale": 0.4,
        "rotation": 0
      }
    },
    "accessory": {
      "bow_tie": {
        "top": "65%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "necklace": {
        "top": "60%",
        "left": "50%",
        "scale": 0.55,
        "rotation": 0
      }
    }
  },
  "meerkat": {
    "hat": {
      "explorer": {
        "top": "15%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "safari": {
        "top": "10%",
        "left": "50%",
        "scale": 0.45,
        "rotation": 0
      }
    },
    "glasses": {
      "greenblinds": {
        "top": "40%",
        "left": "50%",
        "scale": 0.35,
        "rotation": 0
      },
      "hearts": {
        "top": "40%",
        "left": "50%",
        "scale": 0.4,
        "rotation": 0
      }
    },
    "accessory": {
      "bow_tie": {
        "top": "65%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "necklace": {
        "top": "60%",
        "left": "50%",
        "scale": 0.55,
        "rotation": 0
      }
    }
  },
  "otter": {
    "hat": {
      "explorer": {
        "top": "15%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "safari": {
        "top": "10%",
        "left": "50%",
        "scale": 0.45,
        "rotation": 0
      }
    },
    "glasses": {
      "greenblinds": {
        "top": "40%",
        "left": "50%",
        "scale": 0.35,
        "rotation": 0
      },
      "hearts": {
        "top": "40%",
        "left": "50%",
        "scale": 0.4,
        "rotation": 0
      }
    },
    "accessory": {
      "bow_tie": {
        "top": "65%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "necklace": {
        "top": "60%",
        "left": "50%",
        "scale": 0.55,
        "rotation": 0
      }
    }
  },
  "parrot": {
    "hat": {
      "explorer": {
        "top": "15%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "safari": {
        "top": "10%",
        "left": "50%",
        "scale": 0.45,
        "rotation": 0
      }
    },
    "glasses": {
      "greenblinds": {
        "top": "40%",
        "left": "50%",
        "scale": 0.35,
        "rotation": 0
      },
      "hearts": {
        "top": "40%",
        "left": "50%",
        "scale": 0.4,
        "rotation": 0
      }
    },
    "accessory": {
      "bow_tie": {
        "top": "65%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "necklace": {
        "top": "60%",
        "left": "50%",
        "scale": 0.55,
        "rotation": 0
      }
    }
  },
  "border collie": {
    "hat": {
      "explorer": {
        "top": "16%",
        "left": "68%",
        "scale": 0.4,
        "rotation": -5
      },
      "safari": {
        "top": "10%",
        "left": "50%",
        "scale": 0.45,
        "rotation": 0
      }
    },
    "glasses": {
      "greenblinds": {
        "top": "24%",
        "left": "69%",
        "scale": 0.5,
        "rotation": -5
      },
      "hearts": {
        "top": "23%",
        "left": "69%",
        "scale": 0.45,
        "rotation": -5
      }
    },
    "accessory": {
      "bow_tie": {
        "top": "65%",
        "left": "50%",
        "scale": 0.5,
        "rotation": 0
      },
      "necklace": {
        "top": "60%",
        "left": "50%",
        "scale": 0.55,
        "rotation": 0
      }
    }
  }
};

// Default positioning (used as base, then adjusted per animal)
const defaultItemConfigs: Record<string, Partial<AvatarLayer>> = {
  // Hats
  explorer: {
    src: '/avatars/items/hats/explorer.png',
    emoji: '🎩',
    zIndex: 10,
  },
  safari: {
    src: '/avatars/items/hats/safari.png',
    emoji: '👒',
    zIndex: 10,
  },
  
  // Glasses
  greenblinds: {
    src: '/avatars/items/glasses/greenblinds.png',
    emoji: '🕶️',
    zIndex: 8,
  },
  hearts: {
    src: '/avatars/items/glasses/hearts.png',
    emoji: '😍',
    zIndex: 8,
  },
  
  // Accessories
  bow_tie: {
    src: '/avatars/items/accessories/bow_tie.png',
    emoji: '🎀',
    zIndex: 7,
  },
  necklace: {
    src: '/avatars/items/accessories/necklace.png',
    emoji: '📿',
    zIndex: 7,
  },
};

function LayeredAvatar({
  animalType,
  width = 300,
  height = 300,
  items = {},
  onClick,
  className,
  animated = true,
}: LayeredAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [useAvatarImage, setUseAvatarImage] = useState(true);

  // Debug log
  console.log('[LayeredAvatar] Received items:', items);
  console.log('[LayeredAvatar] Animal type:', animalType);

  const handleClick = () => {
    onClick?.();
  };

  // Determine which image to use for the base animal
  const getAnimalImage = () => {
    if (!useAvatarImage) {
      // Fallback to SVG
      const svgName = animalType.toLowerCase() === 'border collie' ? 'border_collie' : animalType.toLowerCase();
      return `/images/${svgName}.svg`;
    }
    // Try avatar image first
    return animalType.toLowerCase() === 'border collie' 
      ? '/avatars/animals/collie.png' 
      : `/avatars/animals/${animalType.toLowerCase()}.png`;
  };

  // Build layers array
  const layers: AvatarLayer[] = [
    // Base animal layer
    {
      id: 'base',
      src: getAnimalImage(),
      emoji: animalEmojis[animalType.toLowerCase()] || '🐾', // Fallback
      zIndex: 1,
      position: { top: '50%', left: '50%' },
    },
  ];

  // Add equipped items as layers with animal-specific adjustments
  Object.entries(items).forEach(([slot, itemId]) => {
    if (itemId && defaultItemConfigs[itemId]) {
      const baseConfig = defaultItemConfigs[itemId];
      const animalKey = animalType.toLowerCase();
      
      // Get the specific adjustment for this animal and item
      const adjustment = animalAdjustments[animalKey]?.[slot as keyof typeof animalAdjustments[typeof animalKey]]?.[itemId];
      
      // If no specific adjustment exists, use border collie as fallback
      const fallbackAdjustment = animalAdjustments['border collie']?.[slot as keyof typeof animalAdjustments['border collie']]?.[itemId];
      
      const finalAdjustment = adjustment || fallbackAdjustment || {
        top: '50%',
        left: '50%',
        scale: 0.5,
        rotation: 0
      };
      
      layers.push({
        id: `${slot}-${itemId}`,
        ...baseConfig,
        position: { 
          top: finalAdjustment.top, 
          left: finalAdjustment.left 
        },
        scale: finalAdjustment.scale,
        rotation: finalAdjustment.rotation,
      });
    }
  });

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all duration-300',
        isHovered && 'scale-105',
        className
      )}
      style={{ width, height, overflow: 'visible' }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Render each layer */}
      {layers.map((layer) => {
        const isBaseLayer = layer.id === 'base';
        const style: CSSProperties = {
          position: 'absolute',
          zIndex: layer.zIndex,
          ...layer.position,
          transform: `
            translate(-50%, -50%) 
            scale(${layer.scale || 1}) 
            rotate(${layer.rotation || 0}deg)
          `,
          transformOrigin: 'center',
          transition: animated ? 'all 0.3s ease' : undefined,
          // Base layer should fill the container
          ...(isBaseLayer ? {
            width: '75%',
            height: '75%',
            maxWidth: '75%',
            maxHeight: '75%',
          } : {}),
        };


        if (layer.src) {
          return (
            <img
              key={layer.id}
              src={layer.src}
              alt=""
              className={isBaseLayer ? "object-contain" : "absolute"}
              style={style}
              draggable={false}
              onError={(e) => {
                if (isBaseLayer && useAvatarImage) {
                  // Fallback to SVG for base animal
                  setUseAvatarImage(false);
                }
              }}
            />
          );
        } else if (layer.emoji) {
          return (
            <span
              key={layer.id}
              className={cn(
                'absolute block text-center select-none',
                isBaseLayer ? 'text-8xl' : 'text-6xl'
              )}
              style={style}
            >
              {layer.emoji}
            </span>
          );
        }
        return null;
      })}


    </div>
  );
}

export default React.memo(LayeredAvatar);
