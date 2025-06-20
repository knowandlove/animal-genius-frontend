import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get public URL for a storage file
export function getStorageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper to upload an image
export async function uploadImage(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string; error: any }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type
    });

  if (error) {
    return { url: '', error };
  }

  const url = getStorageUrl(bucket, path);
  return { url, error: null };
}
