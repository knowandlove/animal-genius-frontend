import React, { useEffect, useState, CSSProperties } from 'react';
import StableRiveWrapper from './StableRiveWrapper';

interface AvatarItemRendererProps {
  itemId: string;
  imageUrl?: string;
  riveUrl?: string;
  assetType: 'image' | 'rive';
  style: CSSProperties;
  onMouseDown?: (e: React.MouseEvent) => void;
  animated?: boolean;
}

export default function AvatarItemRenderer({
  itemId,
  imageUrl,
  riveUrl,
  assetType,
  style,
  onMouseDown,
  animated = true,
}: AvatarItemRendererProps) {
  const [riveError, setRiveError] = useState(false);
  const [isRiveReady, setIsRiveReady] = useState(false);
  
  // CRITICAL DEBUG LOG - Check what data we're receiving
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 AvatarItemRenderer DATA CHECK:', {
      itemId,
      assetType,
      assetTypeEquals: assetType === 'rive',
      assetTypeType: typeof assetType,
      hasImageUrl: !!imageUrl,
      hasRiveUrl: !!riveUrl,
      imageUrl,
      riveUrl,
      style,
    });
  }
  
  // Debug log on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AvatarItemRenderer MOUNTED:', {
        itemId,
        assetType,
        riveUrl,
        imageUrl,
        willUseRive: assetType === 'rive' && !riveError && !!riveUrl
      });
    }
  }, [itemId, assetType, riveUrl, imageUrl, riveError]);

  // Defensive check for Rive items
  if (assetType === 'rive' && !riveUrl) {
    console.warn('⚠️ Rive item is missing riveUrl:', {
      itemId,
      assetType,
      imageUrl,
      riveUrl
    });
    // Fall back to image if we have one
    if (imageUrl) {
      return (
        <img
          key={itemId}
          src={imageUrl}
          alt=""
          style={style}
          draggable={false}
          onMouseDown={onMouseDown}
        />
      );
    }
    return null;
  }

  // If it's a Rive animation and no error occurred
  if (assetType === 'rive' && !riveError && riveUrl) {
    return (
      <StableRiveWrapper
        riveUrl={riveUrl}
        style={style}
        className="avatar-item-rive"
        onMouseDown={onMouseDown}
      />
    );
  }

  // Fallback to image (either it's an image type or Rive failed)
  if (imageUrl) {
    return (
      <img
        key={itemId}
        src={imageUrl}
        alt=""
        style={style}
        draggable={false}
        onMouseDown={onMouseDown}
      />
    );
  }

  // No valid asset to render
  console.warn('No valid asset to render for item:', itemId);
  return null;
}
