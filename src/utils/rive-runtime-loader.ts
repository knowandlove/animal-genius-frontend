// Rive Runtime Preloader
// Loads the WASM runtime once on app startup
import { RuntimeLoader } from '@rive-app/react-canvas';

// Track if runtime is loaded
let runtimeLoaded = false;

// This will be called once in your app initialization
export async function preloadRiveRuntime() {
  if (runtimeLoaded) {
    return true;
  }
  
  try {
    // Import the WASM file directly
    const riveWASMResource = await import('@rive-app/canvas/rive.wasm');
    
    // Set the WASM URL to use the imported resource
    RuntimeLoader.setWasmUrl(riveWASMResource.default);
    
    runtimeLoaded = true;
    console.log('Rive WASM runtime preloaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to preload Rive runtime:', error);
    return false;
  }
}

// Preload specific .riv files
const preloadedRiveFiles = new Map<string, Promise<Response>>();

export function preloadRiveFile(url: string) {
  if (!preloadedRiveFiles.has(url)) {
    // Start fetching but don't await
    const fetchPromise = fetch(url).then(response => {
      if (!response.ok) throw new Error(`Failed to preload ${url}`);
      return response;
    });
    preloadedRiveFiles.set(url, fetchPromise);
  }
  return preloadedRiveFiles.get(url);
}

// Preload multiple RIVE files (useful for preloading all animal animations)
export function preloadMultipleRiveFiles(urls: string[]) {
  urls.forEach(url => preloadRiveFile(url));
}