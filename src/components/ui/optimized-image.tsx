import React from 'react';
import { getAssetUrl, getResponsiveSrcSet, type Asset, type TransformOptions } from '@/lib/storage/asset-urls';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  asset: Asset | null | undefined;
  width?: number;
  height?: number;
  variant?: TransformOptions['format'];
  quality?: number;
  fit?: TransformOptions['fit'];
  fallback?: string;
}

/**
 * Optimized image component that automatically handles:
 * - Cloudflare image optimization
 * - Responsive srcset for retina displays
 * - Lazy loading
 * - Fallback to legacy URLs or placeholders
 */
export function OptimizedImage({ 
  asset,
  width,
  height,
  variant = 'auto',
  quality = 85,
  fit = 'contain',
  className,
  alt,
  fallback = '/placeholder.png',
  loading = 'lazy',
  ...props 
}: OptimizedImageProps) {
  // Handle missing asset
  if (!asset) {
    return (
      <img 
        src={fallback}
        width={width}
        height={height}
        className={className}
        alt={alt || 'Placeholder image'}
        loading={loading}
        {...props}
      />
    );
  }

  // Generate optimized URLs
  const src = getAssetUrl(asset, { 
    width, 
    height, 
    format: variant,
    quality,
    fit
  });
  
  const srcSet = width ? getResponsiveSrcSet(asset, width, height, { 
    format: variant,
    quality,
    fit
  }) : undefined;

  return (
    <img 
      src={src}
      srcSet={srcSet}
      width={width}
      height={height}
      className={className}
      alt={alt || asset.path.split('/').pop()?.split('.')[0] || 'Image'}
      loading={loading}
      {...props}
    />
  );
}

/**
 * Skeleton loader for images
 */
export function ImageSkeleton({ 
  width, 
  height, 
  className 
}: { 
  width?: number; 
  height?: number; 
  className?: string; 
}) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-gray-200 rounded",
        className
      )}
      style={{ 
        width: width || '100%', 
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined
      }}
    />
  );
}

/**
 * Image with loading state
 */
export function OptimizedImageWithLoader(props: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      {isLoading && (
        <ImageSkeleton 
          width={props.width} 
          height={props.height} 
          className={props.className}
        />
      )}
      <OptimizedImage
        {...props}
        className={cn(
          props.className,
          isLoading && 'hidden',
          hasError && 'opacity-50'
        )}
        onLoad={handleLoad}
        onError={handleError}
        fallback={hasError ? props.fallback : undefined}
      />
    </>
  );
}
