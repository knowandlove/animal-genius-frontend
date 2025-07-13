import { getAssetUrl } from '@/utils/cloud-assets';

// Debug logging for animals.ts
console.log('🦁 Animals.ts loading...');

export interface AnimalType {
  name: string;
  imagePath: string;
  personalityTypes: string[];
  dominantFunction: string;
  wildcardDichotomy: string;
  description: string;
  traits: string[];
  leadershipStyle: string[];
  habitat: string;
  thinkingStyle: string;
  color: string;
}

// Helper function to get the correct image path based on cloud storage flag
function getAnimalImagePath(animalName: string): string {
  // Map animal names to their file names
  const fileMap: Record<string, string> = {
    'Meerkat': 'meerkat.png',
    'Panda': 'panda.png',
    'Owl': 'owl.png',
    'Beaver': 'beaver.png',
    'Elephant': 'elephant.png',
    'Otter': 'otter.png',
    'Parrot': 'parrot.png',
    'Border Collie': 'collie.png'
  };
  
  const fileName = fileMap[animalName];
  if (!fileName) return getAssetUrl('/images/kal-character.png');
  
  // Construct the local path and let getAssetUrl handle the cloud/local logic
  const localPath = `/images/${fileName}`;
  return getAssetUrl(localPath);
}

// Canonical MBTI to Animal mappings
export const MBTI_TO_ANIMAL_MAP: Record<string, string> = {
  'INFP': 'Meerkat',
  'ISFP': 'Meerkat',
  'INFJ': 'Panda',
  'INTJ': 'Panda',
  'ISTP': 'Owl',
  'INTP': 'Owl',
  'ISFJ': 'Beaver',
  'ISTJ': 'Beaver',
  'ESFJ': 'Elephant',
  'ENFJ': 'Elephant',
  'ESFP': 'Otter',
  'ESTP': 'Otter',
  'ENFP': 'Parrot',
  'ENTP': 'Parrot',
  'ESTJ': 'Border Collie',
  'ENTJ': 'Border Collie'
};

export const ANIMAL_TYPES: Record<string, AnimalType> = {
  Meerkat: {
    name: "Meerkat",
    imagePath: getAnimalImagePath("Meerkat"),
    personalityTypes: ["ISFP", "INFP"],
    dominantFunction: "Introverted Feeling (Fi)",
    wildcardDichotomy: "S/N",
    description: "Creative, Empathetic, Imaginative",
    traits: [
      "Creative souls who lead with empathy",
      "Imaginative and artistic",
      "Values-driven decisions",
      "Authentic and genuine"
    ],
    leadershipStyle: [
      "Leads through personal values",
      "Inspires through creativity"
    ],
    habitat: "Collaborative environments with creative freedom",
    thinkingStyle: "Values-based and intuitive",
    color: "#4B4959"
  },
  Panda: {
    name: "Panda",
    imagePath: getAnimalImagePath("Panda"),
    personalityTypes: ["INFJ", "INTJ"],
    dominantFunction: "Introverted Intuition (Ni)",
    wildcardDichotomy: "T/F",
    description: "Reflective, Strategic, Thoughtful",
    traits: [
      "Deep thinkers who plan carefully",
      "Reflective and strategic",
      "Independent problem solvers",
      "Future-focused vision"
    ],
    leadershipStyle: [
      "Leads through vision and planning",
      "Strategic long-term thinking"
    ],
    habitat: "Quiet spaces for deep thinking",
    thinkingStyle: "Strategic and reflective",
    color: "#82BCC8"
  },
  Owl: {
    name: "Owl",
    imagePath: getAnimalImagePath("Owl"),
    personalityTypes: ["ISTP", "INTP"],
    dominantFunction: "Introverted Thinking (Ti)",
    wildcardDichotomy: "S/N",
    description: "Independent, Analytical, Adaptable",
    traits: [
      "Independent problem-solvers",
      "Analytical and logical",
      "Adaptable to new situations",
      "Practical and efficient"
    ],
    leadershipStyle: [
      "Leads through expertise",
      "Problem-solving focused"
    ],
    habitat: "Flexible environments with autonomy",
    thinkingStyle: "Analytical and logical",
    color: "#BAC97D"
  },
  Beaver: {
    name: "Beaver",
    imagePath: getAnimalImagePath("Beaver"),
    personalityTypes: ["ISFJ", "ISTJ"],
    dominantFunction: "Introverted Sensing (Si)",
    wildcardDichotomy: "T/F",
    description: "Reliable, Organized, Supportive",
    traits: [
      "Reliable and dependable",
      "Organized and systematic",
      "Supportive team members",
      "Detail-oriented approach"
    ],
    leadershipStyle: [
      "Leads through service",
      "Systematic and thorough"
    ],
    habitat: "Structured environments with clear expectations",
    thinkingStyle: "Systematic and detail-oriented",
    color: "#829B79"
  },
  Elephant: {
    name: "Elephant",
    imagePath: getAnimalImagePath("Elephant"),
    personalityTypes: ["ESFJ", "ENFJ"],
    dominantFunction: "Extraverted Feeling (Fe)",
    wildcardDichotomy: "S/N",
    description: "Caring, Social, Nurturing",
    traits: [
      "Caring and nurturing",
      "Social and community-focused",
      "Supportive of others",
      "Values harmony and cooperation"
    ],
    leadershipStyle: [
      "Leads through inspiration",
      "People-focused leadership"
    ],
    habitat: "Social environments with team collaboration",
    thinkingStyle: "People-centered and harmonious",
    color: "#BD85C8"
  },
  Otter: {
    name: "Otter",
    imagePath: getAnimalImagePath("Otter"),
    personalityTypes: ["ESFP", "ESTP"],
    dominantFunction: "Extraverted Sensing (Se)",
    wildcardDichotomy: "T/F",
    description: "Playful, Energetic, Spontaneous",
    traits: [
      "Playful and energetic",
      "Spontaneous and flexible",
      "Lives in the moment",
      "Enjoys new experiences"
    ],
    leadershipStyle: [
      "Leads through enthusiasm",
      "Action-oriented leadership"
    ],
    habitat: "Dynamic environments with variety",
    thinkingStyle: "Spontaneous and present-focused",
    color: "#FACC7D"
  },
  Parrot: {
    name: "Parrot",
    imagePath: getAnimalImagePath("Parrot"),
    personalityTypes: ["ENFP", "ENTP"],
    dominantFunction: "Extraverted Intuition (Ne)",
    wildcardDichotomy: "T/F",
    description: "Enthusiastic, Creative, Social",
    traits: [
      "Enthusiastic and inspiring",
      "Creative and innovative",
      "Social and communicative",
      "Sees possibilities everywhere"
    ],
    leadershipStyle: [
      "Leads through inspiration",
      "Innovative and creative"
    ],
    habitat: "Creative environments with social interaction",
    thinkingStyle: "Innovative and possibility-focused",
    color: "#FF8070"
  },
  "Border Collie": {
    name: "Border Collie",
    imagePath: getAnimalImagePath("Border Collie"),
    personalityTypes: ["ESTJ", "ENTJ"],
    dominantFunction: "Extraverted Thinking (Te)",
    wildcardDichotomy: "S/N",
    description: "Leadership, Goal-oriented, Organized",
    traits: [
      "Natural leaders",
      "Goal-oriented and driven",
      "Organized and efficient",
      "Decisive and confident"
    ],
    leadershipStyle: [
      "Leads through direction",
      "Results-focused leadership"
    ],
    habitat: "Structured environments with clear goals",
    thinkingStyle: "Strategic and goal-oriented",
    color: "#DEA77E"
  }
};

export function getAnimalByName(animalName: string): AnimalType | undefined {
  return ANIMAL_TYPES[animalName];
}

export function getAnimalByMBTI(mbtiType: string): AnimalType | undefined {
  const animalName = MBTI_TO_ANIMAL_MAP[mbtiType];
  return animalName ? ANIMAL_TYPES[animalName] : undefined;
}

export function getAllAnimals(): AnimalType[] {
  return Object.values(ANIMAL_TYPES);
}

export function getPersonalityTypes(): string[] {
  return Object.keys(MBTI_TO_ANIMAL_MAP);
}

export function getAnimalTypeFromPersonality(mbtiType: string): string | undefined {
  return MBTI_TO_ANIMAL_MAP[mbtiType];
}
