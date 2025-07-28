import React, { useEffect, useState } from 'react';
import { generateAvatarThumbnail } from '@/utils/avatar-thumbnail';
import { getDefaultColors } from '@/config/animal-color-palettes';
import { cn } from '@/lib/utils';
import { useAvatarCacheStore } from '@/stores/avatarCacheStore';

interface AvatarThumbnailProps {
  passportCode: string;
  animalType: string;
  avatarData?: {
    colors?: {
      primaryColor: string;
      secondaryColor: string;
    };
  };
  size?: number;
  className?: string;
  showBorder?: boolean;
  onClick?: () => void;
}

/**
 * Efficient avatar thumbnail component that generates and caches
 * small circular headshots of customized avatars
 */
export function AvatarThumbnail({
  passportCode,
  animalType,
  avatarData,
  size = 48,
  className = '',
  showBorder = true,
  onClick
}: AvatarThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const { getThumbnail, setThumbnail: cacheThumbnail, needsRefresh } = useAvatarCacheStore();

  useEffect(() => {
    let mounted = true;

    const loadThumbnail = async () => {
      try {
        setIsLoading(true);
        setError(false);

        // Get colors from avatarData or use defaults
        const colors = avatarData?.colors || getDefaultColors(animalType);
        
        // Check cache first
        const cached = getThumbnail(passportCode);
        if (cached && !needsRefresh(passportCode, colors.primaryColor, colors.secondaryColor)) {
          if (mounted) {
            setThumbnail(cached.dataUrl);
            setIsLoading(false);
          }
          return;
        }
        
        // Generate new thumbnail with 2x size for retina displays
        const dataUrl = await generateAvatarThumbnail(
          animalType,
          colors,
          { size: size * 2 }
        );
        
        if (mounted) {
          setThumbnail(dataUrl);
          setIsLoading(false);
          
          // Cache the result
          cacheThumbnail(
            passportCode,
            dataUrl,
            animalType,
            colors.primaryColor,
            colors.secondaryColor
          );
        }
      } catch (err) {
        console.error('Failed to generate thumbnail:', err);
        if (mounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      mounted = false;
    };
  }, [passportCode, animalType, avatarData, size, getThumbnail, cacheThumbnail, needsRefresh]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-full bg-gray-200 animate-pulse',
          showBorder && 'ring-2 ring-white ring-offset-1',
          className
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  // Error state - show emoji fallback
  if (error || !thumbnail) {
    const animalEmojis: Record<string, string> = {
      'meerkat': '🦫',
      'panda': '🐼',
      'owl': '🦉',
      'beaver': '🦝',
      'elephant': '🐘',
      'otter': '🦦',
      'parrot': '🦜',
      'border-collie': '🐕',
    };

    const emoji = animalEmojis[animalType.toLowerCase()] || '🐾';
    const colors = avatarData?.colors || getDefaultColors(animalType);

    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-white font-bold',
          showBorder && 'ring-2 ring-white ring-offset-1',
          onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
          className
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: colors.primaryColor,
          fontSize: size * 0.5
        }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {emoji}
      </div>
    );
  }

  // Success state
  return (
    <img
      src={thumbnail}
      alt={`${animalType} avatar`}
      className={cn(
        'rounded-full object-cover',
        showBorder && 'ring-2 ring-white ring-offset-1',
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    />
  );
}

/**
 * Batch component for rendering multiple avatars efficiently
 */
export function AvatarThumbnailGroup({
  students,
  size = 40,
  maxDisplay = 5,
  className = ''
}: {
  students: Array<{
    passportCode: string;
    animalType: string;
    name?: string;
    avatarData?: any;
  }>;
  size?: number;
  maxDisplay?: number;
  className?: string;
}) {
  const displayStudents = students.slice(0, maxDisplay);
  const remainingCount = Math.max(0, students.length - maxDisplay);

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayStudents.map((student, index) => (
        <div
          key={student.passportCode}
          className="relative"
          style={{ zIndex: displayStudents.length - index }}
        >
          <AvatarThumbnail
            passportCode={student.passportCode}
            animalType={student.animalType}
            avatarData={student.avatarData}
            size={size}
            showBorder
          />
          {student.name && (
            <div className="sr-only">{student.name}</div>
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className="relative rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium ring-2 ring-white ring-offset-1"
          style={{
            width: size,
            height: size,
            zIndex: 0
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}