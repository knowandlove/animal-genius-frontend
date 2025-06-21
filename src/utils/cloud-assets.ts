/**
 * Centralized cloud asset management
 * All asset URLs should go through this utility to ensure consistent cloud/local switching
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zqyvfnbwpagguutzdvpy.supabase.co';
const USE_CLOUD_STORAGE = import.meta.env.VITE_USE_CLOUD_STORAGE === 'true';



/**
 * Known assets that are in Supabase storage
 * Maps local paths to Supabase bucket/path combinations
 */
const ASSET_MAPPING = {
  // Animal HEAD ICONS - in public-assets/animals/head_icons/
  '/images/beaver.png': { bucket: 'public-assets', path: 'animals/head_icons/beaver.png' },
  '/images/beaver.svg': { bucket: 'public-assets', path: 'animals/head_icons/beaver.svg' },
  '/images/collie.png': { bucket: 'public-assets', path: 'animals/head_icons/collie.png' },
  '/images/border_collie.svg': { bucket: 'public-assets', path: 'animals/head_icons/border_collie.svg' },
  '/images/elephant.png': { bucket: 'public-assets', path: 'animals/head_icons/elephant.png' },
  '/images/elephant.svg': { bucket: 'public-assets', path: 'animals/head_icons/elephant.svg' },
  '/images/meerkat.png': { bucket: 'public-assets', path: 'animals/head_icons/meerkat.png' },
  '/images/meerkat.svg': { bucket: 'public-assets', path: 'animals/head_icons/meerkat.svg' },
  '/images/otter.png': { bucket: 'public-assets', path: 'animals/head_icons/otter.png' },
  '/images/otter.svg': { bucket: 'public-assets', path: 'animals/head_icons/otter.svg' },
  '/images/owl.png': { bucket: 'public-assets', path: 'animals/head_icons/owl.png' },
  '/images/owl.svg': { bucket: 'public-assets', path: 'animals/head_icons/owl.svg' },
  '/images/panda.png': { bucket: 'public-assets', path: 'animals/head_icons/panda.png' },
  '/images/panda.svg': { bucket: 'public-assets', path: 'animals/head_icons/panda.svg' },
  '/images/parrot.png': { bucket: 'public-assets', path: 'animals/head_icons/parrot.png' },
  '/images/parrot.svg': { bucket: 'public-assets', path: 'animals/head_icons/parrot.svg' },
  
  // Animal FULL BODY images - in public-assets/animals/full_body/
  '/animals/full-body/beaver.png': { bucket: 'public-assets', path: 'animals/full_body/beaver_full.png' },
  '/animals/full-body/border_collie.png': { bucket: 'public-assets', path: 'animals/full_body/border_collie_full.png' },
  '/animals/full-body/elephant.png': { bucket: 'public-assets', path: 'animals/full_body/elephant_full.png' },
  '/animals/full-body/meerkat.png': { bucket: 'public-assets', path: 'animals/full_body/meerkat_full.png' },
  '/animals/full-body/otter.png': { bucket: 'public-assets', path: 'animals/full_body/otter_full.png' },
  '/animals/full-body/owl.png': { bucket: 'public-assets', path: 'animals/full_body/owl_full.png' },
  '/animals/full-body/panda.png': { bucket: 'public-assets', path: 'animals/full_body/panda_full.png' },
  '/animals/full-body/parrot.png': { bucket: 'public-assets', path: 'animals/full_body/parrot_full.png' },
  
  // Alternative paths for full body images (the format LayeredAvatarRoom is using)
  '/images/beaver_full.png': { bucket: 'public-assets', path: 'animals/full_body/beaver_full.png' },
  '/images/border_collie_full.png': { bucket: 'public-assets', path: 'animals/full_body/border_collie_full.png' },
  '/images/elephant_full.png': { bucket: 'public-assets', path: 'animals/full_body/elephant_full.png' },
  '/images/meerkat_full.png': { bucket: 'public-assets', path: 'animals/full_body/meerkat_full.png' },
  '/images/otter_full.png': { bucket: 'public-assets', path: 'animals/full_body/otter_full.png' },
  '/images/owl_full.png': { bucket: 'public-assets', path: 'animals/full_body/owl_full.png' },
  '/images/panda_full.png': { bucket: 'public-assets', path: 'animals/full_body/panda_full.png' },
  '/images/parrot_full.png': { bucket: 'public-assets', path: 'animals/full_body/parrot_full.png' },
  
  // UI assets - in public-assets/ui/
  '/rooms/shelves-and-trim.png': { bucket: 'public-assets', path: 'ui/shelves-and-trim.png' },
  '/images/kal-character.png': { bucket: 'public-assets', path: 'ui/kal-character.png' },
  '/images/KALlogocolor.svg': { bucket: 'public-assets', path: 'ui/KALlogocolor.svg' },
  
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
    return localPath;
  }
  
  // Check if we have a mapping for this asset
  const mapping = ASSET_MAPPING[localPath as keyof typeof ASSET_MAPPING];
  
  if (mapping) {
    return getSupabaseUrl(mapping.bucket, mapping.path);
  }
  
  // If no mapping exists, check if it's already a Supabase URL
  if (localPath.includes('supabase.co')) {
    return localPath;
  }
  
  // Fallback to local path if no mapping found
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
