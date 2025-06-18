export interface Question {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
  };
  dimension: 'E/I' | 'S/N' | 'T/F' | 'J/P';
  mapping: {
    A: string;
    B: string;
  };
  audioFile?: string; // Optional audio narration file
}

export const questions: Question[] = [
  // E/I Questions (10 questions)
  {
    id: 1,
    text: "When you come across something new, what do you usually like to do?",
    options: {
      A: "Watch and observe for a moment.",
      B: "Jump right in and figure it out as you go along."
    },
    dimension: 'E/I',
    mapping: { A: 'I', B: 'E' },
    audioFile: 'q1.mp3'
  },
  {
    id: 2,
    text: "How do you prefer to get your energy?",
    options: {
      A: "By doing things with other people.",
      B: "By having some quiet time to yourself."
    },
    dimension: 'E/I',
    mapping: { A: 'E', B: 'I' },
    audioFile: 'q2.mp3'
  },
  {
    id: 3,
    text: "Where do you prefer to focus your attention?",
    options: {
      A: "On what's happening around you with other people.",
      B: "On your own thoughts and ideas."
    },
    dimension: 'E/I',
    mapping: { A: 'E', B: 'I' },
    audioFile: 'q3.mp3'
  },
  {
    id: 4,
    text: "In a classroom discussion, you're more likely to:",
    options: {
      A: "Speak up and share your thoughts right away.",
      B: "Think about it first before deciding if you want to share."
    },
    dimension: 'E/I',
    mapping: { A: 'E', B: 'I' },
    audioFile: 'q4.mp3'
  },
  {
    id: 5,
    text: "During group projects, you usually:",
    options: {
      A: "Like to talk through ideas with everyone.",
      B: "Prefer to work on your part quietly, then share later."
    },
    dimension: 'E/I',
    mapping: { A: 'E', B: 'I' },
    audioFile: 'q5.mp3'
  },
  {
    id: 6,
    text: "When you're feeling stressed, you usually:",
    options: {
      A: "Want to talk it out with friends or family.",
      B: "Need some alone time to think and recharge."
    },
    dimension: 'E/I',
    mapping: { A: 'E', B: 'I' },
    audioFile: 'q6.mp3'
  },
  {
    id: 7,
    text: "You learn best when you can:",
    options: {
      A: "Discuss ideas with classmates and teachers.",
      B: "Read, think, and figure things out on your own first."
    },
    dimension: 'E/I',
    mapping: { A: 'E', B: 'I' },
    audioFile: 'q7.mp3'
  },
  {
    id: 8,
    text: "At parties or social events, you tend to:",
    options: {
      A: "Talk to lots of different people.",
      B: "Stick with a few people you know well."
    },
    dimension: 'E/I',
    mapping: { A: 'E', B: 'I' },
    audioFile: 'q8.mp3'
  },
  {
    id: 9,
    text: "After school, you usually feel:",
    options: {
      A: "Energized and ready to hang out with friends.",
      B: "Like you need some quiet time to decompress."
    },
    dimension: 'E/I',
    mapping: { A: 'E', B: 'I' },
    audioFile: 'q9.mp3'
  },
  {
    id: 10,
    text: "When you have a great idea, you usually:",
    options: {
      A: "Want to share it with others right away.",
      B: "Like to think it through more before sharing."
    },
    dimension: 'E/I',
    mapping: { A: 'E', B: 'I' },
    audioFile: 'q10.mp3'
  },

  // S/N Questions (9 questions)
  {
    id: 11,
    text: "When you hear a new idea, what do you do first?",
    options: {
      A: "Try it out and see what happens.",
      B: "Think of how it connects to other things you know."
    },
    dimension: 'S/N',
    mapping: { A: 'S', B: 'N' },
    audioFile: 'q11.mp3'
  },
  {
    id: 12,
    text: "What kind of details do you usually notice?",
    options: {
      A: "What you can see, touch, or hear right now.",
      B: "What something could become or mean."
    },
    dimension: 'S/N',
    mapping: { A: 'S', B: 'N' },
    audioFile: 'q12.mp3'
  },
  {
    id: 13,
    text: "When you learn something new, what do you find most helpful?",
    options: {
      A: "Step-by-step instructions and examples.",
      B: "Understanding the big picture and main idea first."
    },
    dimension: 'S/N',
    mapping: { A: 'S', B: 'N' },
    audioFile: 'q13.mp3'
  },
  {
    id: 14,
    text: "When solving problems, you tend to:",
    options: {
      A: "Look at what has worked before and use proven methods.",
      B: "Think of new and creative ways to approach it."
    },
    dimension: 'S/N',
    mapping: { A: 'S', B: 'N' },
    audioFile: 'q14.mp3'
  },
  {
    id: 15,
    text: "What kind of books or movies do you prefer?",
    options: {
      A: "Realistic stories about real-life situations.",
      B: "Fantasy, science fiction, or imaginative stories."
    },
    dimension: 'S/N',
    mapping: { A: 'S', B: 'N' },
    audioFile: 'q15.mp3'
  },
  {
    id: 16,
    text: "Which appeals to you more?",
    options: {
      A: "Learning practical skills you can use right away.",
      B: "Exploring big ideas and possibilities for the future."
    },
    dimension: 'S/N',
    mapping: { A: 'S', B: 'N' },
    audioFile: 'q16.mp3'
  },
  {
    id: 17,
    text: "When working on an assignment, you prefer to:",
    options: {
      A: "Follow the directions exactly as given.",
      B: "Add your own creative twist or interpretation."
    },
    dimension: 'S/N',
    mapping: { A: 'S', B: 'N' },
    audioFile: 'q17.mp3'
  },
  {
    id: 18,
    text: "What do you usually notice first about a new place?",
    options: {
      A: "The practical details - where things are, how it's organized.",
      B: "The overall feeling or atmosphere of the place."
    },
    dimension: 'S/N',
    mapping: { A: 'S', B: 'N' },
    audioFile: 'q18.mp3'
  },
  {
    id: 19,
    text: "In science class, you're more interested in:",
    options: {
      A: "Doing experiments and seeing concrete results.",
      B: "Understanding theories and how everything connects."
    },
    dimension: 'S/N',
    mapping: { A: 'S', B: 'N' },
    audioFile: 'q19.mp3'
  },

  // T/F Questions (10 questions)
  {
    id: 20,
    text: "What do you usually care about more?",
    options: {
      A: "People telling the truth.",
      B: "Everyone getting along."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q20.mp3'
  },
  {
    id: 21,
    text: "When making a group decision, what matters most to you?",
    options: {
      A: "What makes the most logical sense.",
      B: "What everyone feels good about."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q21.mp3'
  },
  {
    id: 22,
    text: "What do you find more convincing?",
    options: {
      A: "Facts and logical arguments.",
      B: "Personal stories and how people feel."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q22.mp3'
  },
  {
    id: 23,
    text: "When someone is upset, what do you usually want to do?",
    options: {
      A: "Help them figure out what to do about the problem.",
      B: "Listen and help them feel better."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q23.mp3'
  },
  {
    id: 24,
    text: "When there's a disagreement, you tend to:",
    options: {
      A: "Focus on finding the right answer or solution.",
      B: "Focus on making sure everyone's feelings are considered."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q24.mp3'
  },
  {
    id: 25,
    text: "What's more important in a leader?",
    options: {
      A: "Being fair and making good decisions.",
      B: "Being understanding and caring about people."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q25.mp3'
  },
  {
    id: 26,
    text: "If you had to give advice to a friend, you'd be more likely to:",
    options: {
      A: "Help them think through the pros and cons logically.",
      B: "Help them figure out how they really feel about it."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q26.mp3'
  },
  {
    id: 27,
    text: "When making decisions, what do you rely on most?",
    options: {
      A: "Logical thinking and objective analysis.",
      B: "Your gut feelings and personal values."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q27.mp3'
  },
  {
    id: 28,
    text: "When there's conflict between friends, you usually:",
    options: {
      A: "Try to help them work out a fair solution.",
      B: "Try to help them understand each other's feelings."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q28.mp3'
  },
  {
    id: 29,
    text: "Which is more important to you?",
    options: {
      A: "Being honest, even if it might hurt someone's feelings.",
      B: "Being kind, even if it means not saying everything you think."
    },
    dimension: 'T/F',
    mapping: { A: 'T', B: 'F' },
    audioFile: 'q29.mp3'
  },

  // J/P Questions (9 questions)
  {
    id: 30,
    text: "Which do you prefer?",
    options: {
      A: "Going on adventures and being flexible.",
      B: "Having a set plan and knowing what will happen next."
    },
    dimension: 'J/P',
    mapping: { A: 'P', B: 'J' },
    audioFile: 'q30.mp3'
  },
  {
    id: 31,
    text: "How do you prefer to handle your homework?",
    options: {
      A: "Start right away and get it done on schedule.",
      B: "Wait until you feel inspired or have a good idea."
    },
    dimension: 'J/P',
    mapping: { A: 'J', B: 'P' },
    audioFile: 'q31.mp3'
  },
  {
    id: 32,
    text: "What type of schedule do you prefer?",
    options: {
      A: "Having things planned out in advance.",
      B: "Keeping things open and flexible."
    },
    dimension: 'J/P',
    mapping: { A: 'J', B: 'P' },
    audioFile: 'q32.mp3'
  },
  {
    id: 33,
    text: "How do you feel about deadlines?",
    options: {
      A: "They help you stay organized and get things done.",
      B: "They can feel stressful and limiting."
    },
    dimension: 'J/P',
    mapping: { A: 'J', B: 'P' },
    audioFile: 'q33.mp3'
  },
  {
    id: 34,
    text: "How do you prefer to spend your free time?",
    options: {
      A: "With activities you've planned ahead.",
      B: "Doing whatever feels right in the moment."
    },
    dimension: 'J/P',
    mapping: { A: 'J', B: 'P' },
    audioFile: 'q34.mp3'
  },
  {
    id: 35,
    text: "In your ideal classroom, would you rather have:",
    options: {
      A: "A clear schedule and routine you can count on.",
      B: "Variety and the chance to try different things."
    },
    dimension: 'J/P',
    mapping: { A: 'J', B: 'P' },
    audioFile: 'q35.mp3'
  },
  {
    id: 36,
    text: "When you have a big project, you usually:",
    options: {
      A: "Make a plan and work on it a little bit each day.",
      B: "Wait until you're really motivated, then work intensively."
    },
    dimension: 'J/P',
    mapping: { A: 'J', B: 'P' },
    audioFile: 'q36.mp3'
  },
  {
    id: 37,
    text: "Which situation would you find more stressful?",
    options: {
      A: "Having too many last-minute changes to your plans.",
      B: "Having to stick to a schedule that feels too rigid."
    },
    dimension: 'J/P',
    mapping: { A: 'J', B: 'P' },
    audioFile: 'q37.mp3'
  },
  {
    id: 38,
    text: "How do you like to spend Saturday mornings?",
    options: {
      A: "With a plan for what you want to accomplish.",
      B: "Seeing what feels interesting and going with the flow."
    },
    dimension: 'J/P',
    mapping: { A: 'J', B: 'P' },
    audioFile: 'q38.mp3'
  }
];

// Helper function to get questions by dimension
export const getQuestionsByDimension = (dimension: 'E/I' | 'S/N' | 'T/F' | 'J/P'): Question[] => {
  return questions.filter(q => q.dimension === dimension);
};

// Helper function to get total questions count
export const getTotalQuestions = (): number => {
  return questions.length;
};

// Helper function to validate all dimensions have questions
export const validateQuestionBalance = () => {
  const dimensions = ['E/I', 'S/N', 'T/F', 'J/P'] as const;
  const counts = dimensions.map(dim => ({
    dimension: dim,
    count: getQuestionsByDimension(dim).length
  }));
  
  return counts;
};