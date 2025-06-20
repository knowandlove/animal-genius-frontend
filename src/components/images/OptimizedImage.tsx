import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getAssetUrl, getResponsiveSrcSet, type Asset, type TransformOptions } from '@/utils/asset-urls';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  asset: Asset | string | null | undefined;
  width?: number;
  height?: number;
  variant?: TransformOptions['format'];
  quality?: number;
  fit?: TransformOptions['fit'];
  fallback?: string;
  showSkeleton?: boolean;
}

/**
 * Skeleton loader for images
 */
function ImageSkeleton({ width, height, className }: { width?: number; height?: number; className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 rounded",
        className
      )}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
      }}
    />
  );
}

/**
 * Optimized image component with Cloudflare transformations
 * - Generates responsive srcSet for high-DPI displays
 * - Shows skeleton while loading
 * - Handles missing assets gracefully
 * - Lazy loading by default
 */
export function OptimizedImage({
  asset,
  width,
  height,
  variant = 'auto',
  quality,
  fit,
  className,
  alt,
  fallback = '/images/placeholder.png',
  showSkeleton = true,
  loading = 'lazy',
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(showSkeleton);
  const [hasError, setHasError] = useState(false);

  // Handle missing asset
  if (!asset) {
    if (fallback) {
      return (
        <img
          src={fallback}
          alt={alt || 'Placeholder'}
          width={width}
          height={height}
          className={className}
          {...props}
        />
      );
    }
    return showSkeleton ? <ImageSkeleton width={width} height={height} className={className} /> : null;
  }

  // Generate image URLs with transformations
  const transformOptions: TransformOptions = {
    width,
    height,
    format: variant,
    quality,
    fit,
  };

  const src = hasError ? fallback : getAssetUrl(asset, transformOptions);
  const srcSet = hasError ? undefined : width ? getResponsiveSrcSet(asset, width, height, { format: variant, quality, fit }) : undefined;

  return (
    <>
      {isLoading && showSkeleton && (
        <ImageSkeleton width={width} height={height} className={className} />
      )}
      <img
        src={src}
        srcSet={srcSet}
        width={width}
        height={height}
        className={cn(
          isLoading && showSkeleton ? 'sr-only' : '',
          className
        )}
        alt={alt || (typeof asset === 'object' ? 'Image' : 'Image')}
        loading={loading}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          setIsLoading(false);
          setHasError(true);
          onError?.(e);
        }}
        {...props}
      />
    </>
  );
}

/**
 * Avatar-specific optimized image with rounded styling
 */
export function OptimizedAvatar({
  asset,
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      asset={asset}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      fit="cover"
      {...props}
    />
  );
}

/**
 * Store item image with consistent styling
 */
export function StoreItemImage({
  asset,
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      asset={asset}
      width={200}
      height={200}
      className={cn('rounded-lg object-cover', className)}
      fit="contain"
      quality={85}
      {...props}
    />
  );
}
