import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRoomStore } from '@/stores/roomStore';
import type { StudentPet } from '@/types/pet';
import { Input } from '@/components/ui/input';
import { Edit2, Check, X } from 'lucide-react';
import FishBowl from '@/components/pets/animations/FishBowl';

interface PetDisplayProps {
  pet: StudentPet;
  canEdit: boolean;
  passportCode: string;
}

export default function PetDisplay({ pet, canEdit, passportCode }: PetDisplayProps) {
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(pet.customName);
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 70 }); // Start at middle-bottom
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isWalking, setIsWalking] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const lastPositionRef = useRef({ x: 50, y: 70 });
  
  const updatePetPosition = useRoomStore((state) => state.updatePetPosition);
  const updatePetName = useRoomStore((state) => state.updatePetName);

  // Get sprite metadata from pet data or use defaults
  const spriteMetadata = (pet.pet?.baseStats as any)?.spriteMetadata || {
    frameCount: 4,
    frameWidth: 32,
    frameHeight: 32,
    animationSpeed: 150,
    animationRows: 1,
    scale: 2,
    pixelated: true
  };
  
  // Sprite animation settings
  const SPRITE_FRAMES = spriteMetadata.frameCount;
  const FRAME_WIDTH = spriteMetadata.frameWidth;
  const FRAME_HEIGHT = spriteMetadata.frameHeight;
  const ANIMATION_SPEED = spriteMetadata.animationSpeed;
  const SCALE = spriteMetadata.scale || 2;
  
  // Calculate actual sprite sheet dimensions
  const SHEET_WIDTH = FRAME_WIDTH * SPRITE_FRAMES;
  const SHEET_HEIGHT = FRAME_HEIGHT * (spriteMetadata.animationRows || 1);
  
  // For now, use the walk animation (row 1, or row 0 if only 1 row)
  const currentAnimationRow = spriteMetadata.animationRows > 1 ? 1 : 0;

  // Animate sprite frames when walking
  useEffect(() => {
    if (!isWalking) {
      setCurrentFrame(0);
      return;
    }

    const frameInterval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % SPRITE_FRAMES);
    }, ANIMATION_SPEED);

    return () => clearInterval(frameInterval);
  }, [isWalking]);

  // Random horizontal movement effect
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPosition(prevPos => {
        // Generate random movement (only horizontal)
        const moveDistance = (Math.random() - 0.5) * 30; // Move up to 15% left or right
        const newX = prevPos.x + moveDistance;
        
        // Keep within room bounds (10-90% horizontally)
        const clampedX = Math.max(10, Math.min(90, newX));
        
        // Determine direction based on movement
        if (clampedX > prevPos.x) {
          setDirection('right');
        } else if (clampedX < prevPos.x) {
          setDirection('left');
        }
        
        // Set walking state
        if (Math.abs(clampedX - prevPos.x) > 0.1) {
          setIsWalking(true);
          setTimeout(() => setIsWalking(false), 2000); // Walk for 2 seconds
        }
        
        lastPositionRef.current = { x: clampedX, y: prevPos.y };
        return { x: clampedX, y: prevPos.y }; // Keep Y constant
      });
    }, 3000); // Move every 3 seconds

    return () => clearInterval(moveInterval);
  }, []);

  // Calculate visual state based on stats
  const getVisualState = (stats: { hunger: number; happiness: number }) => {
    if (stats.happiness >= 70) return 'happy';
    if (stats.happiness >= 40) return 'neutral';
    return 'sad';
  };

  // Update pet name mutation
  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      // The petId here is the studentPet ID
      return apiRequest('PUT', `/api/pets/${pet.id}/rename`, {
        newName: newName,
      });
    },
    onSuccess: () => {
      // The response is just { success: true }, so we use the name we sent
      updatePetName(editedName.trim());
      setIsEditingName(false);
      setInteractionMessage('✅ Pet name updated!');
      setTimeout(() => setInteractionMessage(null), 3000);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/room-page-data/${passportCode}`] });
    },
    onError: (error: any) => {
      setInteractionMessage(`❌ ${error.message || 'Failed to update name'}`);
      setTimeout(() => setInteractionMessage(null), 3000);
      setEditedName(pet.customName); // Reset to original name
    }
  });

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== pet.customName) {
      updateNameMutation.mutate(editedName.trim());
    } else {
      setIsEditingName(false);
      setEditedName(pet.customName);
    }
  };

  const stats = pet.calculatedStats || { hunger: pet.hunger, happiness: pet.happiness };
  const visualState = pet.visualState || getVisualState(stats);

  // Get the pet's asset URL
  const petAssetUrl = (pet.pet as any)?.assetUrl || (pet as any).assetUrl;
  
  // Check if we should use sprite animation (if the asset is our sprite sheet)
  const useSprite = petAssetUrl && (
    petAssetUrl.includes('corgi_walk_sprite') || 
    petAssetUrl.includes('sprite') ||
    pet.pet?.species === 'regular_corgi' ||
    pet.pet?.species === 'code_dog' || 
    pet.pet?.species === 'data_dog'
  );
  
  // Get pet emoji based on species (fallback)
  const getPetEmoji = (species: string) => {
    const emojiMap: Record<string, string> = {
      'code_dog': '🐕',
      'data_dog': '🐕',
      'cyber_cat': '🐱',
      'ai_cat': '🐱',
      'logic_bird': '🦜',
      'cloud_bird': '🦜',
      'bug_hamster': '🐹',
      'byte_hamster': '🐹',
      'quantum_fish': '🐠',
      'neural_fish': '🐠',
      'pixel_rabbit': '🐰',
      'vector_rabbit': '🐰',
    };
    return emojiMap[species] || '🐾';
  };

  const petEmoji = pet.pet?.species ? getPetEmoji(pet.pet.species) : '🐾';

  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        animate={{
          left: `${position.x}%`,
          top: `${position.y}%`,
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
        }}
        style={{
          transform: 'translate(-50%, -50%)',
          zIndex: Math.floor(position.y * 10) + 10, // Pets are above room items but below UI
        }}
      >
      {useSprite ? (
        // Sprite sheet animation
        <div 
          className="relative"
          style={{
            width: `${FRAME_WIDTH * SCALE}px`,
            height: `${FRAME_HEIGHT * SCALE}px`,
            transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${petAssetUrl || '/assets/pets/corgi_walk_sprite.png'})`,
              // Scale the entire sprite sheet
              backgroundSize: `${SHEET_WIDTH * SCALE}px ${SHEET_HEIGHT * SCALE}px`,
              // Position: -frameX -rowY
              backgroundPosition: `-${currentFrame * FRAME_WIDTH * SCALE}px -${currentAnimationRow * FRAME_HEIGHT * SCALE}px`,
              backgroundRepeat: 'no-repeat',
              imageRendering: spriteMetadata.pixelated ? 'pixelated' : 'auto',
            }}
          />
        </div>
      ) : (
        // Emoji fallback for other pets
        <motion.div
          className="text-4xl sm:text-5xl"
          animate={{
            y: visualState === 'happy' ? [0, -5, 0] : 0,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {petEmoji}
        </motion.div>
      )}
      
      {/* Pet name label */}
      <div className="absolute pointer-events-auto" style={{ top: '-25px', left: '50%', transform: 'translateX(-50%)' }}>
        {isEditingName ? (
          <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm px-2 py-1">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setEditedName(pet.customName);
                }
              }}
              className="h-6 w-24 text-xs"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="text-green-600 hover:text-green-700"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setIsEditingName(false);
                setEditedName(pet.customName);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-white/90 rounded-lg shadow-sm px-2 py-1">
            <span className="text-xs font-medium">{pet.customName}</span>
            {canEdit && (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Interaction message */}
      <AnimatePresence>
        {interactionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute pointer-events-none"
            style={{ top: '-50px', left: '50%', transform: 'translateX(-50%)' }}
          >
            <div className="bg-black/75 text-white text-xs rounded-lg px-3 py-1 whitespace-nowrap">
              {interactionMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}