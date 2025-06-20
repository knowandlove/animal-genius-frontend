// Frontend utility for generating Cloudflare-optimized asset URLs
// This module handles the client-side URL generation for cloud storage assets

const CLOUDFLARE_ZONE = import.meta.env.VITE_CLOUDFLARE_ZONE;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const USE_CLOUD_STORAGE = import.meta.env.VITE_USE_CLOUD_STORAGE === 'true';

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
}

export interface Asset {
  bucket: string;
  path: string;
  legacyUrl?: string; // For rollback support
}

/**
 * Generate asset URL with optional Cloudflare transformations
 * If cloud storage is disabled, falls back to legacy URL
 */
export function getAssetUrl(
  asset: Asset | null | undefined, 
  options: TransformOptions = {}
): string {
  // Handle null/undefined assets
  if (!asset) {
    return '/placeholder.png'; // Return a placeholder image
  }

  // Feature flag check - use legacy URL if cloud storage is disabled
  if (!USE_CLOUD_STORAGE && asset.legacyUrl) {
    return asset.legacyUrl;
  }

  // Ensure we have required Supabase URL
  if (!SUPABASE_URL) {
    console.error('VITE_SUPABASE_URL is not configured');
    return asset.legacyUrl || '/placeholder.png';
  }

  // Construct base Supabase storage URL
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${asset.bucket}/${asset.path}`;

  // If no transformations needed or no Cloudflare zone configured, return direct URL
  if (!CLOUDFLARE_ZONE || (!options.width && !options.height && !options.format)) {
    return baseUrl;
  }

  // Build Cloudflare transformation parameters
  const params = new URLSearchParams();
  
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.quality) params.set('quality', String(options.quality));
  if (options.fit) params.set('fit', options.fit);
  
  // Default to auto format for best browser support
  params.set('format', options.format || 'auto');

  // Return Cloudflare-optimized URL
  return `https://${CLOUDFLARE_ZONE}/cdn-cgi/image/${params.toString()}/${baseUrl}`;
}

/**
 * Generate responsive image srcset for high-DPI displays
 */
export function getResponsiveSrcSet(
  asset: Asset | null | undefined,
  baseWidth: number,
  baseHeight?: number,
  options: Omit<TransformOptions, 'width' | 'height'> = {}
): string {
  if (!asset) return '';

  const scales = [1, 2, 3]; // 1x, 2x, 3x for retina displays
  
  return scales
    .map(scale => {
      const url = getAssetUrl(asset, {
        ...options,
        width: baseWidth * scale,
        height: baseHeight ? baseHeight * scale : undefined
      });
      return `${url} ${scale}x`;
    })
    .join(', ');
}

/**
 * Get thumbnail URL with standard sizing
 */
export function getThumbnailUrl(
  asset: Asset | null | undefined,
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  const sizes = {
    small: { width: 100, height: 100 },
    medium: { width: 200, height: 200 },
    large: { width: 400, height: 400 }
  };

  return getAssetUrl(asset, {
    ...sizes[size],
    fit: 'cover',
    quality: 85
  });
}

/**
 * For private assets that require signed URLs
 * This should call your backend API to generate a signed URL
 */
export async function getPrivateAssetUrl(
  asset: Asset,
  options?: TransformOptions
): Promise<string> {
  if (!USE_CLOUD_STORAGE) {
    return asset.legacyUrl || '/placeholder.png';
  }

  try {
    const response = await fetch('/api/assets/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        bucket: asset.bucket, 
        path: asset.path,
        transformOptions: options 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get signed URL');
    }

    const { signedUrl } = await response.json();
    return signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return asset.legacyUrl || '/placeholder.png';
  }
}

/**
 * Helper to check if cloud storage is enabled
 */
export function isCloudStorageEnabled(): boolean {
  return USE_CLOUD_STORAGE;
}

/**
 * Helper to construct asset object from database fields
 */
export function createAssetFromDb(
  bucket: string | null,
  path: string | null,
  legacyUrl?: string | null
): Asset | null {
  if (!bucket || !path) {
    if (legacyUrl) {
      // Return legacy asset for backwards compatibility
      return {
        bucket: '',
        path: '',
        legacyUrl
      };
    }
    return null;
  }

  return {
    bucket,
    path,
    legacyUrl: legacyUrl || undefined
  };
}
