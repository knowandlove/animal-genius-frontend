import { useState, useEffect } from 'react';

interface ServerAvatarProps {
  animalType: string;
  primaryColor?: string;
  secondaryColor?: string;
  equippedItems?: string[];
  width: number;
  height: number;
  className?: string;
  animated?: boolean;
  onClick?: () => void;
}

/**
 * ServerAvatar - Clean, simple avatar component that uses server-processed SVGs
 * No race conditions, no complex state, just an img tag!
 */
export function ServerAvatar({
  animalType,
  primaryColor = '#D4A574',
  secondaryColor = '#FFFDD0',
  equippedItems = [],
  width,
  height,
  className = '',
  animated = false,
  onClick
}: ServerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Use backend URL from environment with production fallback
  const baseUrl = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:5001' : 'https://animal-genius-backend.onrender.com');
  
  // Build URL with all parameters
  const params = new URLSearchParams({
    primary: primaryColor,
    secondary: secondaryColor,
    ...(equippedItems.length && { items: equippedItems.join(',') })
  });
  
  const svgUrl = `${baseUrl}/api/avatar/${animalType}?${params}`;
  
  // Debug: Log URL changes and environment
  console.log('ServerAvatar Debug:', {
    animalType,
    primaryColor,
    secondaryColor,
    baseUrl,
    envUrl: import.meta.env.VITE_API_URL,
    hostname: window.location.hostname,
    fullUrl: svgUrl
  });
  const fallbackUrl = `/avatars/animals/${animalType.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')}.png`;
  
  // Reset loaded and error state when URL changes
  useEffect(() => {
    console.log('ServerAvatar URL changed, resetting state:', svgUrl);
    setImageLoaded(false);
    setImageError(false); // Reset error state to retry loading
  }, [svgUrl]);
  
  if (imageError) {
    // Fallback to static PNG if server fails
    return (
      <img
        src={fallbackUrl}
        alt={`${animalType} avatar`}
        width={width}
        height={height}
        className={className}
        onClick={onClick}
      />
    );
  }
  
  return (
    <div style={{ width, height, position: 'relative' }}>
      {/* Show loading spinner until image is loaded */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {/* Image is always rendered but hidden until loaded */}
      <img
        src={svgUrl}
        alt={`${animalType} avatar`}
        width={width}
        height={height}
        crossOrigin="anonymous"  // Enable CORS for cross-origin image loading
        className={`${animated ? 'animate-avatar-idle hover:animate-avatar-wave' : ''} ${className}`}
        style={{ 
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: '100%',
          objectFit: 'contain',
          cursor: onClick ? 'pointer' : undefined,
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
        onClick={onClick}
        onLoad={() => {
          console.log('ServerAvatar loaded successfully:', svgUrl);
          setImageLoaded(true);
        }}
        onError={(e) => {
          console.error('ServerAvatar failed to load:', svgUrl, e);
          setImageError(true);
        }}
      />
    </div>
  );
}

// Export a default as well for easier imports
export default ServerAvatar;