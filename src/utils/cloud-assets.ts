/**
 * Centralized cloud asset management
 * All asset URLs should go through this utility to ensure consistent cloud/local switching
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const USE_CLOUD_STORAGE = import.meta.env.VITE_USE_CLOUD_STORAGE === 'true';

// Debug logging
console.log('🌩️ Cloud Assets Config:', {
  USE_CLOUD_STORAGE,
  SUPABASE_URL,
  env: import.meta.env.VITE_USE_CLOUD_STORAGE
});

/**
 * Known assets that are in Supabase storage
 * Maps local paths to Supabase bucket/path combinations
 */
const ASSET_MAPPING = {
  // Animal images - in public-assets/animals/
  '/images/beaver.png': { bucket: 'public-assets', path: 'animals/beaver.png' },
  '/images/beaver.svg': { bucket: 'public-assets', path: 'animals/beaver.svg' },
  '/images/collie.png': { bucket: 'public-assets', path: 'animals/collie.png' },
  '/images/border_collie.svg': { bucket: 'public-assets', path: 'animals/border_collie.svg' },
  '/images/elephant.png': { bucket: 'public-assets', path: 'animals/elephant.png' },
  '/images/elephant.svg': { bucket: 'public-assets', path: 'animals/elephant.svg' },
  '/images/meerkat.png': { bucket: 'public-assets', path: 'animals/meerkat.png' },
  '/images/meerkat.svg': { bucket: 'public-assets', path: 'animals/meerkat.svg' },
  '/images/otter.png': { bucket: 'public-assets', path: 'animals/otter.png' },
  '/images/otter.svg': { bucket: 'public-assets', path: 'animals/otter.svg' },
  '/images/owl.png': { bucket: 'public-assets', path: 'animals/owl.png' },
  '/images/owl.svg': { bucket: 'public-assets', path: 'animals/owl.svg' },
  '/images/panda.png': { bucket: 'public-assets', path: 'animals/panda.png' },
  '/images/panda.svg': { bucket: 'public-assets', path: 'animals/panda.svg' },
  '/images/parrot.png': { bucket: 'public-assets', path: 'animals/parrot.png' },
  '/images/parrot.svg': { bucket: 'public-assets', path: 'animals/parrot.svg' },
  
  // UI assets - in public-assets/ui/
  '/rooms/shelves-and-trim.png': { bucket: 'public-assets', path: 'ui/shelves-and-trim.png' },
  '/images/kal-character.png': { bucket: 'public-assets', path: 'ui/kal-character.png' },
  
  // Add more mappings as needed...
} as const;

/**
 * Generate Supabase storage URL
 */
function getSupabaseUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Main function to get asset URL
 * @param localPath - The local path (e.g., '/images/parrot.png')
 * @returns The appropriate URL based on USE_CLOUD_STORAGE flag
 */
export function getAssetUrl(localPath: string): string {
  // If cloud storage is disabled, return local path
  if (!USE_CLOUD_STORAGE) {
    console.log(`📁 Using local path: ${localPath}`);
    return localPath;
  }
  
  // Check if we have a mapping for this asset
  const mapping = ASSET_MAPPING[localPath as keyof typeof ASSET_MAPPING];
  
  if (mapping) {
    const cloudUrl = getSupabaseUrl(mapping.bucket, mapping.path);
    console.log(`☁️ Mapped ${localPath} → ${cloudUrl}`);
    return cloudUrl;
  }
  
  // If no mapping exists, check if it's already a Supabase URL
  if (localPath.includes('supabase.co')) {
    console.log(`✅ Already a Supabase URL: ${localPath}`);
    return localPath;
  }
  
  // Fallback to local path if no mapping found
  console.warn(`⚠️ No cloud mapping for: ${localPath}, using local`);
  return localPath;
}

/**
 * Check if cloud storage is enabled
 */
export function isCloudStorageEnabled(): boolean {
  return USE_CLOUD_STORAGE;
}

/**
 * Get all available asset mappings (useful for debugging)
 */
export function getAllAssetMappings() {
  return ASSET_MAPPING;
}

/**
 * Convert a local path to cloud path (if mapping exists)
 */
export function getCloudPath(localPath: string): { bucket: string; path: string } | null {
  const mapping = ASSET_MAPPING[localPath as keyof typeof ASSET_MAPPING];
  return mapping || null;
}

/**
 * Batch convert multiple local paths to appropriate URLs
 */
export function getAssetUrls(localPaths: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  localPaths.forEach(path => {
    result[path] = getAssetUrl(path);
  });
  return result;
}
