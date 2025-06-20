/**
 * Asset URL utilities for Cloudflare image transformation
 * Handles both legacy and cloud storage URLs based on feature flag
 */

const CLOUDFLARE_ZONE = import.meta.env.VITE_CLOUDFLARE_ZONE;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const USE_CLOUD_STORAGE = import.meta.env.VITE_USE_CLOUD_STORAGE === 'true';

export interface Asset {
  bucket: string;
  path: string;
  legacyUrl?: string;
}

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
}

/**
 * Get the URL for an asset with optional Cloudflare transformations
 * Falls back to legacy URL if cloud storage is disabled
 */
export function getAssetUrl(
  asset: Asset | string,
  options: TransformOptions = {}
): string {
  // Handle legacy string URLs
  if (typeof asset === 'string') {
    return asset;
  }

  // Use legacy URL if cloud storage is disabled
  if (!USE_CLOUD_STORAGE && asset.legacyUrl) {
    return asset.legacyUrl;
  }

  // Construct Supabase storage URL
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${asset.bucket}/${asset.path}`;

  // If no transformations needed or no Cloudflare zone, return direct URL
  if (!CLOUDFLARE_ZONE || (!options.width && !options.height && !options.format)) {
    return baseUrl;
  }

  // Build Cloudflare transformation parameters
  const params = new URLSearchParams();
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.quality) params.set('quality', String(options.quality || 85));
  if (options.fit) params.set('fit', options.fit);
  params.set('format', options.format || 'auto'); // Auto-detect best format

  // Return Cloudflare-optimized URL
  return `https://${CLOUDFLARE_ZONE}/cdn-cgi/image/${params.toString()}/${baseUrl}`;
}

/**
 * Generate responsive srcSet for high-DPI displays
 */
export function getResponsiveSrcSet(
  asset: Asset | string,
  baseWidth: number,
  baseHeight?: number,
  options?: Omit<TransformOptions, 'width' | 'height'>
): string {
  const sizes = [1, 2, 3]; // 1x, 2x, 3x
  
  return sizes
    .map(scale => {
      const width = baseWidth * scale;
      const height = baseHeight ? baseHeight * scale : undefined;
      const url = getAssetUrl(asset, { ...options, width, height });
      return `${url} ${scale}x`;
    })
    .join(', ');
}

/**
 * Get URL for a private asset (future user-generated content)
 * This will need to call the backend to generate a signed URL
 */
export async function getPrivateAssetUrl(
  asset: Asset,
  options?: TransformOptions
): Promise<string> {
  const response = await fetch('/api/assets/signed-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucket: asset.bucket,
      path: asset.path,
      transformOptions: options,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get signed URL');
  }

  const { signedUrl } = await response.json();
  return signedUrl;
}

/**
 * Helper to check if cloud storage is enabled
 */
export function isCloudStorageEnabled(): boolean {
  return USE_CLOUD_STORAGE;
}

/**
 * Helper to get the appropriate image URL from a store item
 * Handles the transition period where items might have both asset and legacy URLs
 */
export function getStoreItemImageUrl(
  item: { 
    asset?: Asset | null; 
    imageUrl?: string | null; 
    legacyImageUrl?: string | null;
  },
  options?: TransformOptions
): string {
  // Priority: asset > imageUrl > legacyImageUrl > placeholder
  if (item.asset) {
    return getAssetUrl(item.asset, options);
  }
  
  if (item.imageUrl) {
    return item.imageUrl;
  }
  
  if (item.legacyImageUrl) {
    return item.legacyImageUrl;
  }
  
  // Return a placeholder image
  return '/images/placeholder.png';
}
