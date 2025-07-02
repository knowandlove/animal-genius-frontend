/**
 * Normalized positioning system for avatar items
 * All coordinates are in [0, 1] range relative to the avatar image bounds
 */

export interface NormalizedPosition {
  x: number; // 0.0 = left edge, 1.0 = right edge
  y: number; // 0.0 = top edge, 1.0 = bottom edge
  scale: number; // Relative to largest dimension
  rotation: number; // Degrees
  anchorX: number; // Item's anchor point X (0-1)
  anchorY: number; // Item's anchor point Y (0-1)
}

export interface ImageBounds {
  width: number;
  height: number;
  left: number;
  top: number;
}

/**
 * Get the actual rendered bounds of an image with object-contain
 */
export function getImageBounds(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
): ImageBounds {
  const containerAspect = containerWidth / containerHeight;
  const imageAspect = imageWidth / imageHeight;
  
  let renderedWidth = containerWidth;
  let renderedHeight = containerHeight;
  
  if (containerAspect > imageAspect) {
    // Container is wider - image will be height-constrained
    renderedWidth = containerHeight * imageAspect;
  } else {
    // Container is taller - image will be width-constrained
    renderedHeight = containerWidth / imageAspect;
  }
  
  const left = (containerWidth - renderedWidth) / 2;
  const top = (containerHeight - renderedHeight) / 2;
  
  return { width: renderedWidth, height: renderedHeight, left, top };
}

/**
 * Convert pixel coordinates to normalized coordinates
 * Used in the admin positioning tool
 */
export function pixelsToNormalized(
  pixelX: number,
  pixelY: number,
  imageBounds: ImageBounds
): { x: number; y: number } {
  // Calculate position relative to image bounds
  const relativeX = pixelX - imageBounds.left;
  const relativeY = pixelY - imageBounds.top;
  
  // Normalize to 0-1 range
  const normalizedX = Math.max(0, Math.min(1, relativeX / imageBounds.width));
  const normalizedY = Math.max(0, Math.min(1, relativeY / imageBounds.height));
  
  return { x: normalizedX, y: normalizedY };
}

/**
 * Convert normalized coordinates to pixel coordinates
 * Used in display components
 */
export function normalizedToPixels(
  normalizedX: number,
  normalizedY: number,
  imageBounds: ImageBounds
): { x: number; y: number } {
  const pixelX = imageBounds.left + normalizedX * imageBounds.width;
  const pixelY = imageBounds.top + normalizedY * imageBounds.height;
  
  return { x: pixelX, y: pixelY };
}

/**
 * Calculate item size based on normalized scale
 * Scale is relative to the largest dimension of the rendered image
 */
export function calculateItemSize(
  normalizedScale: number,
  imageBounds: ImageBounds,
  itemAspectRatio?: number
): { width: number; height: number } {
  // Use largest dimension as reference
  const referenceSize = Math.max(imageBounds.width, imageBounds.height);
  const width = normalizedScale * referenceSize;
  
  // If aspect ratio provided, calculate height
  const height = itemAspectRatio ? width / itemAspectRatio : width;
  
  return { width, height };
}

/**
 * Generate CSS transform for positioned item
 */
export function getItemTransform(position: NormalizedPosition): string {
  // Translate by negative anchor percentages to position anchor point at target
  const translateX = -(position.anchorX * 100);
  const translateY = -(position.anchorY * 100);
  
  return `translate(${translateX}%, ${translateY}%) rotate(${position.rotation}deg)`;
}

/**
 * Get transform origin based on anchor point
 */
export function getTransformOrigin(anchorX: number, anchorY: number): string {
  return `${anchorX * 100}% ${anchorY * 100}%`;
}

/**
 * Default anchor points for different item types
 */
export const DEFAULT_ANCHORS = {
  hat: { x: 0.5, y: 1.0 }, // Bottom center
  glasses: { x: 0.5, y: 0.5 }, // Center
  accessory: { x: 0.5, y: 0.5 }, // Center
} as const;

/**
 * Get bounds from an image element after it loads
 */
export async function getImageElementBounds(
  img: HTMLImageElement,
  container: HTMLElement
): Promise<ImageBounds> {
  return new Promise((resolve) => {
    const calculateBounds = () => {
      const rect = img.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Get position relative to container
      const left = rect.left - containerRect.left;
      const top = rect.top - containerRect.top;
      
      resolve({
        width: rect.width,
        height: rect.height,
        left,
        top
      });
    };
    
    if (img.complete) {
      calculateBounds();
    } else {
      img.addEventListener('load', calculateBounds, { once: true });
    }
  });
}