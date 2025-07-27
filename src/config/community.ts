// Community Hub Configuration and Constants

export const CATEGORIES = [
  { value: 'lessons', label: 'Lessons & Activities', description: 'Share effective lessons and activities' },
  { value: 'animals', label: 'Animal Combinations', description: 'Discuss specific animal mix dynamics' },
  { value: 'challenges', label: 'Challenges & Solutions', description: 'Problem-solving for classroom issues' },
  { value: 'success_stories', label: 'Success Stories', description: 'Celebrate what worked in your classroom' },
  { value: 'ask_teachers', label: 'Ask Teachers', description: 'Get advice from the community' },
  { value: 'feedback', label: 'Beta Feedback', description: 'Share feedback and suggestions for the platform' },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  lessons: 'Lessons & Activities',
  animals: 'Animal Combinations',
  challenges: 'Challenges & Solutions',
  success_stories: 'Success Stories',
  ask_teachers: 'Ask Teachers',
  feedback: 'Beta Feedback',
};

export const CATEGORY_COLORS: Record<string, string> = {
  lessons: 'bg-blue-100 text-blue-800',
  animals: 'bg-purple-100 text-purple-800',
  challenges: 'bg-red-100 text-red-800',
  success_stories: 'bg-green-100 text-green-800',
  ask_teachers: 'bg-yellow-100 text-yellow-800',
  feedback: 'bg-orange-100 text-orange-800',
};

export const GRADE_OPTIONS = [
  { value: 'k-2', label: 'K-2nd Grade' },
  { value: '3-5', label: '3rd-5th Grade' },
  { value: '6-8', label: '6th-8th Grade' },
  { value: '9-12', label: '9th-12th Grade' },
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'trending', label: 'Trending' },
  { value: 'helpful', label: 'Most Helpful' },
  { value: 'unanswered', label: 'Unanswered' },
];