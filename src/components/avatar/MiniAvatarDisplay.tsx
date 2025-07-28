import React from 'react';
import { AvatarThumbnail } from './AvatarThumbnail';
import { cn } from '@/lib/utils';

interface MiniAvatarDisplayProps {
  passportCode?: string;
  studentName: string;
  animalType: string;
  avatarData?: any;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48
};

/**
 * Compact avatar display for use in lists, tables, and other space-constrained areas
 */
export function MiniAvatarDisplay({
  passportCode,
  studentName,
  animalType,
  avatarData,
  size = 'sm',
  showName = false,
  className = '',
  onClick
}: MiniAvatarDisplayProps) {
  const avatarSize = sizeMap[size];

  // If no passport code, show initials
  if (!passportCode) {
    const initials = studentName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        className={cn(
          'inline-flex items-center gap-2',
          onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
        onClick={onClick}
      >
        <div
          className="rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white font-semibold flex items-center justify-center"
          style={{
            width: avatarSize,
            height: avatarSize,
            fontSize: avatarSize * 0.4
          }}
        >
          {initials}
        </div>
        {showName && (
          <span className="text-sm font-medium truncate max-w-[120px]">
            {studentName}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      <AvatarThumbnail
        passportCode={passportCode}
        animalType={animalType}
        avatarData={avatarData}
        size={avatarSize}
        showBorder={false}
      />
      {showName && (
        <span className="text-sm font-medium truncate max-w-[120px]">
          {studentName}
        </span>
      )}
    </div>
  );
}

/**
 * Display a row of mini avatars with overflow handling
 */
export function MiniAvatarGroup({
  students,
  maxDisplay = 5,
  size = 'sm',
  className = ''
}: {
  students: Array<{
    passportCode?: string;
    studentName: string;
    animalType: string;
    avatarData?: any;
  }>;
  maxDisplay?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const displayStudents = students.slice(0, maxDisplay);
  const remainingCount = Math.max(0, students.length - maxDisplay);
  const avatarSize = sizeMap[size];

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayStudents.map((student, index) => (
        <div
          key={student.passportCode || student.studentName}
          className="relative"
          style={{ zIndex: displayStudents.length - index }}
        >
          <MiniAvatarDisplay
            passportCode={student.passportCode}
            studentName={student.studentName}
            animalType={student.animalType}
            avatarData={student.avatarData}
            size={size}
            className="ring-2 ring-white"
          />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className="relative rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium ring-2 ring-white"
          style={{
            width: avatarSize,
            height: avatarSize,
            fontSize: avatarSize * 0.4,
            zIndex: 0
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}