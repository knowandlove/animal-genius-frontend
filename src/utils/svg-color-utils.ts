/**
 * Utility functions for SVG color manipulation
 */

import { getAssetUrl } from './cloud-assets';

export interface SVGColorGroups {
  primary: Element[];
  secondary: Element[];
  fixed: Element[];
  outlines: Element[];
}

/**
 * Load SVG content from a URL
 */
export async function loadSVGContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading SVG:', error);
    throw error;
  }
}

/**
 * Parse SVG string and return a DOM element
 */
export function parseSVG(svgString: string): SVGElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  
  if (!svg) {
    throw new Error('Invalid SVG content');
  }
  
  return svg;
}

/**
 * Find color groups in an SVG element
 */
export function findColorGroups(svg: SVGElement): SVGColorGroups {
  const groups: SVGColorGroups = {
    primary: [],
    secondary: [],
    fixed: [],
    outlines: []
  };
  
  // Find primary color group
  const primaryGroup = svg.querySelector('#primary-color');
  if (primaryGroup) {
    groups.primary = Array.from(primaryGroup.querySelectorAll('[fill]'));
  }
  
  // Find secondary color group
  const secondaryGroup = svg.querySelector('#secondary-color');
  if (secondaryGroup) {
    groups.secondary = Array.from(secondaryGroup.querySelectorAll('[fill]'));
  }
  
  // Find fixed parts
  const fixedGroup = svg.querySelector('#fixed-parts');
  if (fixedGroup) {
    groups.fixed = Array.from(fixedGroup.querySelectorAll('[fill]'));
  }
  
  // Find outlines
  const outlinesGroup = svg.querySelector('#outlines');
  if (outlinesGroup) {
    groups.outlines = Array.from(outlinesGroup.querySelectorAll('[stroke]'));
  }
  
  return groups;
}

/**
 * Apply colors to SVG groups
 */
export function applyColorsToSVG(
  svg: SVGElement,
  primaryColor: string,
  secondaryColor: string
): SVGElement {
  const groups = findColorGroups(svg);
  
  // Apply primary color
  groups.primary.forEach(element => {
    element.setAttribute('fill', primaryColor);
  });
  
  // Apply secondary color
  groups.secondary.forEach(element => {
    element.setAttribute('fill', secondaryColor);
  });
  
  return svg;
}

/**
 * Convert SVG element to data URL
 */
export function svgToDataURL(svg: SVGElement): string {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get colored avatar SVG URL
 */
export async function getColoredAvatarURL(
  animalType: string,
  primaryColor: string,
  secondaryColor: string
): Promise<string> {
  try {
    // Normalize animal type
    const normalizedAnimal = animalType.toLowerCase().replace(/\s+/g, '-');
    const animalFileName = normalizedAnimal === 'border-collie' ? 'collie' : normalizedAnimal;
    
    // Get SVG URL
    const svgUrl = getAssetUrl(`/avatars/animals/${animalFileName}.svg`);
    
    // Load SVG content
    const svgContent = await loadSVGContent(svgUrl);
    
    // Parse SVG
    const svg = parseSVG(svgContent);
    
    // Apply colors
    const coloredSVG = applyColorsToSVG(svg, primaryColor, secondaryColor);
    
    // Convert to data URL
    return svgToDataURL(coloredSVG);
  } catch (error) {
    console.error('Error creating colored avatar:', error);
    // Return original PNG as fallback
    const normalizedAnimal = animalType.toLowerCase().replace(/\s+/g, '-');
    const animalFileName = normalizedAnimal === 'border-collie' ? 'collie' : normalizedAnimal;
    return getAssetUrl(`/avatars/animals/${animalFileName}.png`);
  }
}

/**
 * Create an inline SVG element with custom colors
 */
export function createInlineSVG(
  svgContent: string,
  primaryColor: string,
  secondaryColor: string,
  width: number,
  height: number
): HTMLDivElement {
  const container = document.createElement('div');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.innerHTML = svgContent;
  
  const svg = container.querySelector('svg');
  if (svg) {
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    applyColorsToSVG(svg, primaryColor, secondaryColor);
  }
  
  return container;
}
