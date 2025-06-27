import React from 'react';

// Define icon component props
interface IconProps {
  className?: string;
}

// Book Icon
export const BookIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-1.95 0-4.05.4-5.5 1.5v14.65c0 .25.25.5.5.35 1.35-.65 3.3-1 4.75-1 1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1 .25.05.5-.1.5-.35V6.5c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
  </svg>
);

// Science Icon (Flask)
export const ScienceIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 2v2h1v14a4 4 0 0 0 8 0V4h1V2H7zm4 2h2v4h-2V4zm0 6h2v8a2 2 0 1 1-4 0v-8h2z"/>
  </svg>
);

// Art Icon (Palette)
export const ArtIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.21-.64-1.67-.08-.09-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

// Music Icon
export const MusicIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>
);

// Sports Icon (Soccer Ball)
export const SportsIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 3.3l1.35-.95c1.82.56 3.37 1.76 4.38 3.34l-.39 1.34-1.35.46L13 6.7V3.3zm-3.35-.95L11 5.3v3.4L7.01 9.49l-1.35-.46-.39-1.34c1.01-1.58 2.56-2.78 4.38-3.34zM7.08 17.11l-1.14.1c-.9-1.3-1.47-2.91-1.47-4.21 0-.36.03-.72.08-1.08l1.47-.42 1.04.89v3.56l-.98 1.16zm4.37 2.59c-.48.09-.98.14-1.45.14s-.97-.05-1.45-.14l-.72-1.45.91-.97h3.52l.91.97-.72 1.45zm4.53 0l-.72-1.45.91-.97 1.04.89 1.47-.42c.05-.36.08-.72.08-1.08 0-1.3-.57-2.91-1.47-4.21l-1.14.1-.98 1.16v3.56zm1.93-7.02l-1.35.46-1.99-.79v-2.8l1.99-.79 1.35.46.39 1.34c-.05.36-.08.72-.08 1.08s.03.72.08 1.08l-.39 1.34z"/>
  </svg>
);

// Math Icon (Calculator)
export const MathIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 9h2v2H7V9zm0 4h2v2H7v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2zm2 4h-2v2h2v-2zm-4 0h-2v2h2v-2zm-4 0H7v2h2v-2z"/>
  </svg>
);

// Globe Icon
export const GlobeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

// Rocket Icon
export const RocketIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.5c0 0-5 2-5 9.5 0 2 1 3.5 2 4.5L7.5 22l2.5-2h4l2.5 2-1.5-5.5c1-1 2-2.5 2-4.5 0-7.5-5-9.5-5-9.5zm0 4.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
  </svg>
);

// Star Icon
export const StarIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

// Heart Icon
export const HeartIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

// Lightbulb Icon
export const LightbulbIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
  </svg>
);

// Tree Icon
export const TreeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L4.5 11.5c0 .5.5 1 1 1H7l-2 4c0 .5.5 1 1 1h5v5h2v-5h5c.5 0 1-.5 1-1l-2-4h1.5c.5 0 1-.5 1-1L12 2z"/>
  </svg>
);

// Map icon ids to components
export const CLASS_ICONS_MAP: Record<string, React.FC<IconProps>> = {
  book: BookIcon,
  science: ScienceIcon,
  art: ArtIcon,
  music: MusicIcon,
  sports: SportsIcon,
  math: MathIcon,
  globe: GlobeIcon,
  rocket: RocketIcon,
  star: StarIcon,
  heart: HeartIcon,
  lightbulb: LightbulbIcon,
  tree: TreeIcon,
};

// Icon metadata for selection
export const CLASS_ICONS = [
  { id: 'book', label: 'Book', Icon: BookIcon },
  { id: 'science', label: 'Science', Icon: ScienceIcon },
  { id: 'art', label: 'Art', Icon: ArtIcon },
  { id: 'music', label: 'Music', Icon: MusicIcon },
  { id: 'sports', label: 'Sports', Icon: SportsIcon },
  { id: 'math', label: 'Math', Icon: MathIcon },
  { id: 'globe', label: 'Globe', Icon: GlobeIcon },
  { id: 'rocket', label: 'Rocket', Icon: RocketIcon },
  { id: 'star', label: 'Star', Icon: StarIcon },
  { id: 'heart', label: 'Heart', Icon: HeartIcon },
  { id: 'lightbulb', label: 'Lightbulb', Icon: LightbulbIcon },
  { id: 'tree', label: 'Tree', Icon: TreeIcon },
];
