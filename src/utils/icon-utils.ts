import { 
  BookOpen, 
  GraduationCap, 
  Palette, 
  Microscope, 
  Calculator, 
  Globe, 
  Rocket, 
  Star, 
  Heart, 
  Lightbulb, 
  Music, 
  TreePine 
} from "lucide-react";

// Map icon IDs to Lucide React components
const iconComponentMap: Record<string, any> = {
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'palette': Palette,
  'microscope': Microscope,
  'calculator': Calculator,
  'globe': Globe,
  'rocket': Rocket,
  'star': Star,
  'heart': Heart,
  'lightbulb': Lightbulb,
  'music': Music,
  'tree-pine': TreePine,
  // Legacy emoji fallbacks for existing classes
  '📚': BookOpen,
  '🎓': GraduationCap,
  '✏️': Palette,
  '🔬': Microscope,
  '🎨': Palette,
  '⚗️': Microscope,
  '📊': Calculator,
  '🧮': Calculator,
  '🌟': Star,
  '💡': Lightbulb,
  'book': BookOpen,
  'default': BookOpen
};

/**
 * Get the icon component for a class icon
 * @param iconId - Icon identifier (new system) or emoji (legacy)
 * @returns Lucide React icon component
 */
export const getIconComponent = (iconId?: string): any => {
  if (!iconId) return BookOpen;
  return iconComponentMap[iconId] || BookOpen;
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getIconComponent instead
 */
export const getIconEmoji = (iconEmoji?: string, icon?: string): string => {
  // For backward compatibility, return the icon ID or a default emoji
  return iconEmoji || icon || '📚';
};

/**
 * Get the background color for a class icon
 * @param iconColor - Frontend color value (preferred)
 * @param backgroundColor - Backend color value
 * @returns The color string to use
 */
export const getIconColor = (iconColor?: string, backgroundColor?: string): string => {
  return iconColor || backgroundColor || "hsl(202 25% 65%)";
};