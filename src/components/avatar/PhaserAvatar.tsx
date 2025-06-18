import { useEffect, useRef, useState } from 'react';

// Dynamic import for Phaser to avoid build issues
let Phaser: any = null;

// Simple avatar display component for now
interface SimpleAvatarProps {
  animalType: string;
  items?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  width?: number;
  height?: number;
}

function SimpleAvatar({ animalType, items = {}, width = 400, height = 400 }: SimpleAvatarProps) {
  const [bouncing, setBouncing] = useState(false);

  const handleClick = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 600);
  };

  return (
    <div 
      className={`relative flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 rounded-lg border-2 border-gray-300 cursor-pointer transition-transform ${bouncing ? 'animate-bounce' : ''}`}
      style={{ width, height }}
      onClick={handleClick}
    >
      <div className="text-center">
        <div className="text-6xl mb-4">
          {getAnimalEmoji(animalType)}
        </div>
        <div className="text-sm font-medium text-gray-700 mb-2">
          {animalType.charAt(0).toUpperCase() + animalType.slice(1)}
        </div>
        {Object.entries(items).map(([slot, item]) => 
          item && (
            <div key={slot} className="text-xs text-gray-600">
              {slot}: {item}
            </div>
          )
        )}
      </div>
      <div className="absolute top-2 right-2 text-xs text-gray-500">
        Click to bounce!
      </div>
    </div>
  );
}

function getAnimalEmoji(animalType: string): string {
  const animalEmojis: Record<string, string> = {
    beaver: '🦫',
    panda: '🐼',
    owl: '🦉',
    elephant: '🐘',
    otter: '🦦',
    parrot: '🦜',
    meerkat: '🦦', // Close enough
    'border collie': '🐕',
    default: '🐾'
  };
  return animalEmojis[animalType.toLowerCase()] || animalEmojis.default;
}

// Phaser classes for when Phaser is loaded
let Avatar: any = null;
let AvatarScene: any = null;

// Initialize Phaser classes when module is loaded
function initializePhaserClasses(PhaserModule: any) {
  // Avatar container class - like a Flash MovieClip!
  Avatar = class extends PhaserModule.GameObjects.Container {
    private baseAnimal: any;
    private equipped: Record<string, any> = {};
    
    // Define where items should be positioned for each slot
    private slots = {
      hat: { x: 0, y: -120, scale: 0.8 },
      glasses: { x: 0, y: -30, scale: 0.7 },
      accessory: { x: 0, y: 40, scale: 0.6 }
    };

    constructor(scene: any, x: number, y: number, animalType: string) {
      super(scene, x, y);
      
      // Create the base animal
      this.baseAnimal = scene.add.image(0, 0, animalType);
      this.add(this.baseAnimal);
      
      // Scale down the base animal if needed
      this.baseAnimal.setScale(0.5);
      
      scene.add.existing(this);
    }

    equipItem(slotName: keyof typeof this.slots, itemKey: string) {
      // Remove old item if exists
      if (this.equipped[slotName]) {
        this.equipped[slotName].destroy();
      }
      
      // Get slot configuration
      const slot = this.slots[slotName];
      
      // Create new item
      const item = this.scene.add.image(slot.x, slot.y, itemKey);
      item.setScale(slot.scale);
      
      // Add to container
      this.add(item);
      this.equipped[slotName] = item;
      
      // Fun entrance animation!
      this.scene.tweens.add({
        targets: item,
        scaleX: slot.scale * 1.2,
        scaleY: slot.scale * 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      });
    }

    removeItem(slotName: keyof typeof this.slots) {
      if (this.equipped[slotName]) {
        // Fade out animation
        this.scene.tweens.add({
          targets: this.equipped[slotName],
          alpha: 0,
          scale: 0,
          duration: 200,
          onComplete: () => {
            this.equipped[slotName]?.destroy();
            delete this.equipped[slotName];
          }
        });
      }
    }

    // Make the avatar do a little bounce
    bounce() {
      this.scene.tweens.add({
        targets: this,
        y: this.y - 20,
        duration: 300,
        yoyo: true,
        ease: 'Power2'
      });
    }
  };

  // Phaser Scene for the avatar
  AvatarScene = class extends PhaserModule.Scene {
    private avatar?: any;

    constructor() {
      super({ key: 'AvatarScene' });
    }

    preload() {
      // For testing - we'll use generated placeholders
      const placeholders = {
        beaver: this.generatePlaceholder('#8B4513', 'Beaver'),
        wizard_hat: this.generatePlaceholder('#4B0082', 'Hat'),
        crown: this.generatePlaceholder('#FFD700', 'Crown'),
        cap: this.generatePlaceholder('#FF0000', 'Cap'),
        glasses: this.generatePlaceholder('#333333', 'Glasses'),
        sunglasses: this.generatePlaceholder('#000000', 'Shades'),
        bow_tie: this.generatePlaceholder('#FF1493', 'Bow'),
        necklace: this.generatePlaceholder('#FFD700', 'Chain')
      };
      
      // Load placeholders as textures
      Object.entries(placeholders).forEach(([key, dataUrl]) => {
        this.textures.addBase64(key, dataUrl);
      });
    }

    private generatePlaceholder(color: string, text: string): string {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 200, 200);
      
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 100, 100);
      
      return canvas.toDataURL();
    }

    create() {
      // Create the avatar in the center
      this.avatar = new Avatar(this, 200, 200, 'beaver');
      
      // Make it interactive
      this.avatar.setInteractive();
      this.avatar.on('pointerdown', () => {
        this.avatar?.bounce();
      });
    }

    // Methods to control avatar from React
    equipItem(slot: string, item: string) {
      this.avatar?.equipItem(slot as any, item);
    }

    removeItem(slot: string) {
      this.avatar?.removeItem(slot as any);
    }
  };
}

interface PhaserAvatarProps {
  animalType: string;
  items?: {
    hat?: string;
    glasses?: string;
    accessory?: string;
  };
  width?: number;
  height?: number;
}

export default function PhaserAvatar({ 
  animalType = 'beaver',
  items = {},
  width = 400,
  height = 400 
}: PhaserAvatarProps) {
  const gameRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phaserLoaded, setPhaserLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Dynamic Phaser loading
  useEffect(() => {
    async function loadPhaser() {
      try {
        const PhaserModule = await import('phaser');
        Phaser = PhaserModule.default || PhaserModule;
        initializePhaserClasses(Phaser);
        setPhaserLoaded(true);
      } catch (error) {
        console.warn('Failed to load Phaser:', error);
        setLoadError(true);
      }
    }

    if (!Phaser && !loadError) {
      loadPhaser();
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !phaserLoaded || !Phaser || !AvatarScene) return;

    // Phaser configuration
    const config = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: '#f0f0f0',
      scene: AvatarScene,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }
        }
      }
    };

    // Create game
    gameRef.current = new Phaser.Game(config);
    
    // Get scene reference when ready
    gameRef.current.events.once('ready', () => {
      sceneRef.current = gameRef.current?.scene.getScene('AvatarScene');
    });

    // Cleanup
    return () => {
      gameRef.current?.destroy(true);
    };
  }, [width, height, phaserLoaded]);

  // Update items when props change
  useEffect(() => {
    if (!sceneRef.current) return;

    // Equip items based on props
    if (items.hat) {
      sceneRef.current.equipItem('hat', items.hat);
    }
    if (items.glasses) {
      sceneRef.current.equipItem('glasses', items.glasses);
    }
    if (items.accessory) {
      sceneRef.current.equipItem('accessory', items.accessory);
    }
  }, [items]);

  // Show simple avatar if Phaser fails to load
  if (loadError || !phaserLoaded) {
    return <SimpleAvatar animalType={animalType} items={items} width={width} height={height} />;
  }

  return (
    <div 
      ref={containerRef} 
      className="phaser-avatar-container"
      style={{ width, height }}
    />
  );
}