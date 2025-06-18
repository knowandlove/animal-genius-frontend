import { questions } from './quiz-questions';
import { MBTI_TO_ANIMAL_MAP, getAnimalByMBTI as getAnimalData } from './animals';

export interface QuizAnswer {
  questionId: number;
  answer: 'A' | 'B' | 'C' | 'D';
}

export interface QuizResults {
  scores: {
    E: number;
    I: number;
    S: number;
    N: number;
    T: number;
    F: number;
    J: number;
    P: number;
  };
  mbtiType: string;
  animal: string;
  wildcard?: string;
}

export function calculateResults(answers: QuizAnswer[]): QuizResults {
  // Initialize scores
  const scores = {
    E: 0, I: 0,
    S: 0, N: 0,
    T: 0, F: 0,
    J: 0, P: 0
  };

  // Calculate scores based on answers
  answers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return;

    const selectedMapping = answer.answer === 'A' ? question.mapping.A : question.mapping.B;
    scores[selectedMapping as keyof typeof scores]++;
  });

  // Determine personality type
  const personalityType = [
    scores.E >= scores.I ? 'E' : 'I',
    scores.S >= scores.N ? 'S' : 'N',
    scores.T >= scores.F ? 'T' : 'F',
    scores.J >= scores.P ? 'J' : 'P'
  ].join('');

  // Get animal from canonical mapping
  const animal = MBTI_TO_ANIMAL_MAP[personalityType] || 'Unknown';

  // Detect wildcard (close scores)
  let wildcard: string | undefined;
  const scoreDiffs = [
    Math.abs(scores.E - scores.I),
    Math.abs(scores.S - scores.N),
    Math.abs(scores.T - scores.F),
    Math.abs(scores.J - scores.P)
  ];
  
  if (Math.min(...scoreDiffs) <= 1) {
    const wildcardIndex = scoreDiffs.indexOf(Math.min(...scoreDiffs));
    const wildcardDimensions = ['E/I', 'S/N', 'T/F', 'J/P'];
    wildcard = wildcardDimensions[wildcardIndex];
  }

  return {
    scores,
    mbtiType: personalityType,
    animal,
    wildcard
  };
}

export function resolveTieWithDominantFunction(
  scores: QuizResults['scores'],
  animalType: string
): string {
  const mbtiType = Object.keys(MBTI_TO_ANIMAL_MAP).find(key => 
    MBTI_TO_ANIMAL_MAP[key] === animalType
  );
  
  if (!mbtiType) return animalType;
  
  const animalData = getAnimalData(mbtiType);
  if (!animalData) return animalType;

  // Use the wildcard dichotomy to resolve ties
  const wildcardDim = animalData.wildcardDichotomy;
  
  if (wildcardDim === 'E/I') {
    return scores.E >= scores.I ? 'E' : 'I';
  } else if (wildcardDim === 'S/N') {
    return scores.S >= scores.N ? 'S' : 'N';
  } else if (wildcardDim === 'T/F') {
    return scores.T >= scores.F ? 'T' : 'F';
  } else if (wildcardDim === 'J/P') {
    return scores.J >= scores.P ? 'J' : 'P';
  }

  return animalType;
}

export function getAllAnimals(): string[] {
  return Array.from(new Set(Object.values(MBTI_TO_ANIMAL_MAP)));
}

export function getAnimalByMBTI(mbtiType: string): string {
  return MBTI_TO_ANIMAL_MAP[mbtiType] || 'Unknown';
}

export function getMBTITypesByAnimal(animal: string): string[] {
  return Object.keys(MBTI_TO_ANIMAL_MAP).filter(key => MBTI_TO_ANIMAL_MAP[key] === animal);
}

// Animal details for results page (consolidated with canonical mappings)
export const animalDetails = {
  'Meerkat': {
    name: 'Meerkat',
    traits: 'Creative, Empathetic, Imaginative',
    color: '#10B981',
    emoji: '🪁',
    description: 'Meerkats are caring souls who lead with empathy and imagination.',
    mbtiTypes: ['INFP', 'ISFP']
  },
  'Panda': {
    name: 'Panda',
    traits: 'Reflective, Strategic, Thoughtful',
    color: '#6366F1',
    emoji: '🐼',
    description: 'Pandas are deep thinkers who carefully plan and reflect before acting.',
    mbtiTypes: ['INFJ', 'INTJ']
  },
  'Owl': {
    name: 'Owl',
    traits: 'Independent, Analytical, Adaptable',
    color: '#8B5CF6',
    emoji: '🦉',
    description: 'Owls are independent problem-solvers who adapt quickly to new situations.',
    mbtiTypes: ['ISTP', 'INTP']
  },
  'Beaver': {
    name: 'Beaver',
    traits: 'Hardworking, Responsible, Reliable',
    color: '#F59E0B',
    emoji: '🦫',
    description: 'Beavers are dedicated workers who take their responsibilities seriously.',
    mbtiTypes: ['ISFJ', 'ISTJ']
  },
  'Elephant': {
    name: 'Elephant',
    traits: 'Compassionate, Supportive, Team-oriented',
    color: '#06B6D4',
    emoji: '🐘',
    description: 'Elephants are caring leaders who build strong, supportive communities.',
    mbtiTypes: ['ESFJ', 'ENFJ']
  },
  'Otter': {
    name: 'Otter',
    traits: 'Energetic, Playful, Spontaneous',
    color: '#EF4444',
    emoji: '🦦',
    description: 'Otters bring positive energy and fun to everything they do.',
    mbtiTypes: ['ESFP', 'ESTP']
  },
  'Parrot': {
    name: 'Parrot',
    traits: 'Enthusiastic, Creative, Communicative',
    color: '#10B981',
    emoji: '🦜',
    description: 'Parrots are enthusiastic communicators who inspire others with their ideas.',
    mbtiTypes: ['ENFP', 'ENTP']
  },
  'Border Collie': {
    name: 'Border Collie',
    traits: 'Strategic, Goal-oriented, Leadership',
    color: '#7C3AED',
    emoji: '🐕',
    description: 'Border Collies are natural leaders who organize resources to achieve ambitious goals.',
    mbtiTypes: ['ESTJ', 'ENTJ']
  }
};