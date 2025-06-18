import { cn } from '@/lib/utils';
import { AnimalType, AvatarCustomization } from '@shared/game-types';

interface AnimalAvatarProps {
  animal: AnimalType;
  customization?: AvatarCustomization;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
  playerName?: string;
}

export function AnimalAvatar({ 
  animal, 
  customization = {}, 
  size = 'md',
  className,
  showName = false,
  playerName
}: AnimalAvatarProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  // Animal images (matching what we use in student reports)
  const getAnimalImagePath = (animal: AnimalType): string => {
    const imageMap: Record<AnimalType, string> = {
      'Meerkat': '/images/meerkat.svg',
      'Panda': '/images/panda.png',
      'Owl': '/images/owl.png',
      'Beaver': '/images/beaver.svg',
      'Elephant': '/images/elephant.png',
      'Otter': '/images/otter.png',
      'Parrot': '/images/parrot.png',
      'Border Collie': '/images/collie.png'
    };
    return imageMap[animal] || '/images/kal-character.png';
  };

  // Accessory styles
  const glassesStyles: Record<string, string> = {
    round: '🥽',
    square: '🤓',
    star: '✨'
  };

  const hatStyles: Record<string, string> = {
    cap: '🧢',
    party: '🎉',
    crown: '👑'
  };

  const neckStyles: Record<string, string> = {
    bowtie: '🎀',
    scarf: '🧣',
    necklace: '📿'
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Main animal container */}
      <div className={cn(
        "relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20",
        sizeClasses[size]
      )}>
        {/* Hat - positioned above */}
        {customization.hat && (
          <div className="absolute -top-2 text-2xl">
            {hatStyles[customization.hat]}
          </div>
        )}

        {/* Animal image */}
        <div className={cn(
          "flex items-center justify-center",
          size === 'sm' && "w-12 h-12",
          size === 'md' && "w-16 h-16",
          size === 'lg' && "w-24 h-24",
          size === 'xl' && "w-32 h-32"
        )}>
          <img 
            src={getAnimalImagePath(animal)} 
            alt={animal}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Glasses - positioned on eyes */}
        {customization.glasses && (
          <div className="absolute top-1/3 text-xl">
            {glassesStyles[customization.glasses]}
          </div>
        )}

        {/* Neck item - positioned below */}
        {customization.neckItem && (
          <div className="absolute bottom-0 text-lg">
            {neckStyles[customization.neckItem]}
          </div>
        )}
      </div>

      {/* Player name */}
      {showName && playerName && (
        <div className="text-center mt-2">
          <p className="text-sm font-medium truncate max-w-[100px]">
            {playerName}
          </p>
        </div>
      )}
    </div>
  );
}