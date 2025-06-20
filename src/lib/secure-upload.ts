import { getAuthToken } from './auth';

export interface UploadImageOptions {
  file: File;
  type?: 'animal' | 'item' | 'ui' | 'user';
  category?: string;
  itemType?: string;
  name?: string;
  bucket?: 'public-assets' | 'store-items' | 'user-generated';
  onProgress?: (progress: number) => void;
}

export interface UploadImageResult {
  success: boolean;
  url?: string;
  assetId?: string;
  error?: string;
}

/**
 * Upload an image securely through the backend
 * This replaces direct Supabase uploads for security
 */
export async function uploadImage({
  file,
  type = 'item',
  category,
  itemType,
  name,
  bucket = 'store-items',
  onProgress
}: UploadImageOptions): Promise<UploadImageResult> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (category) formData.append('category', category);
    if (itemType) formData.append('itemType', itemType);
    if (name) formData.append('name', name);
    formData.append('bucket', bucket);

    // Get auth token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve({
                success: true,
                url: response.url,
                assetId: response.assetId
              });
            } else {
              resolve({
                success: false,
                error: response.error || 'Upload failed'
              });
            }
          } catch (error) {
            resolve({
              success: false,
              error: 'Invalid server response'
            });
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            resolve({
              success: false,
              error: errorResponse.error || `Upload failed (${xhr.status})`
            });
          } catch {
            resolve({
              success: false,
              error: `Upload failed (${xhr.status})`
            });
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload'
        });
      });

      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          error: 'Upload cancelled'
        });
      });

      // Set up request
      xhr.open('POST', '/api/admin/upload-asset');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      // Send request
      xhr.send(formData);
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
}

/**
 * Delete an asset (only works with cloud storage)
 */
export async function deleteAsset(assetId: string): Promise<boolean> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/admin/delete-asset/${assetId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Delete asset error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete asset error:', error);
    return false;
  }
}

/**
 * Get storage status and configuration
 */
export async function getStorageStatus(): Promise<{
  cloudStorageEnabled: boolean;
  supabaseConfigured: boolean;
  featureFlag: string;
  buckets: string[];
}> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/admin/storage-status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get storage status');
    }

    return await response.json();
  } catch (error) {
    console.error('Get storage status error:', error);
    throw error;
  }
}

/**
 * Helper to validate file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be less than 10MB' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Please use JPEG, PNG, GIF, or WebP format' };
  }

  return { valid: true };
}
