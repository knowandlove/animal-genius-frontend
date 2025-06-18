// This creates simple colored rectangles as placeholders
// Replace these with your actual PNGs later!

export function generatePlaceholderImage(color: string, text: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;
  
  // Fill with color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 400, 400);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 200, 200);
  
  return canvas.toDataURL();
}

// Generate placeholder assets
export const placeholderAssets = {
  // Animals
  beaver: generatePlaceholderImage('#8B4513', 'Beaver'),
  dolphin: generatePlaceholderImage('#4682B4', 'Dolphin'),
  elephant: generatePlaceholderImage('#808080', 'Elephant'),
  
  // Hats
  wizard_hat: generatePlaceholderImage('#4B0082', 'Wizard Hat'),
  crown: generatePlaceholderImage('#FFD700', 'Crown'),
  cap: generatePlaceholderImage('#FF0000', 'Cap'),
  
  // Accessories
  glasses: generatePlaceholderImage('#000000', 'Glasses'),
  bow_tie: generatePlaceholderImage('#FF1493', 'Bow Tie'),
  necklace: generatePlaceholderImage('#FFD700', 'Necklace'),
};
