export interface Lesson {
  id: number;
  title: string;
  duration: string;
  description: string;
  objectives: string[];
  materialsNeeded: string[];
  activities: {
    activity1: Activity;
    activity2: Activity;
    activity3: Activity;
    activity4: Activity;
  };
}

export interface Activity {
  title: string;
  optional?: boolean;
  steps: ActivityStep[];
}

export interface ActivityStep {
  instruction: string;
  tips?: string[];
  guidingQuestions?: string[];
}

export const lessons: Lesson[] = [
  {
    id: 1,
    title: "Taking the Animal Genius Quiz®",
    duration: "60 minutes",
    description: "Students take the interactive Animal Genius Quiz® to discover their personality animal and begin understanding their unique traits.",
    objectives: [
      "Students will complete the Animal Genius Personality Quiz®",
      "Students will discover their personality animal",
      "Students will begin to understand personality differences",
      "Students will create visual representations of their animal identity"
    ],
    materialsNeeded: [
      "Computers/tablets for quiz access",
      "Class code for quiz access",
      "Table tent templates",
      "Markers, colored pencils, crayons",
      "Knowing and Loving, Me! worksheet (optional)",
      "Parent letter and Family Zoo worksheet (optional)"
    ],
    activities: {
      activity1: {
        title: "Take the Animal Genius Quiz®",
        steps: [
          {
            instruction: "Play Student-facing video [LINK TO A POP UP VIDEO TEACHERS CAN DRAG TO PROJECTOR SCREEN TO SHOW KIDS]"
          },
          {
            instruction: "Students take the Animal Genius Quiz® individually (15-20 min)",
            tips: [
              "Project 'Live View' so students can see the results coming in live",
              "Remind students: there are no wrong answers, just be honest about their answers. Do not answer based on what their parents, friends or teacher would want them to say"
            ]
          },
          {
            instruction: "Students receive their animal type + results description"
          },
          {
            instruction: "Prompt students to read and reflect",
            guidingQuestions: [
              "What part feels most true?",
              "What parts can you relate to?",
              "What parts are not true for you?"
            ]
          }
        ]
      },
      activity2: {
        title: "Decorate Table Tents",
        steps: [
          {
            instruction: "Pass out Table Tent templates"
          },
          {
            instruction: "Offer supplies: markers, colored pencils, crayons, etc.",
            tips: [
              "Encourage creativity and design"
            ]
          },
          {
            instruction: "Let students decorate their Table Tents"
          },
          {
            instruction: "Optional: Do a classroom gallery walk or table group discussions"
          }
        ]
      },
      activity3: {
        title: "Knowing and Loving, Me! Worksheet",
        optional: true,
        steps: [
          {
            instruction: "Hand out the 'Knowing and Loving, Me!' worksheet"
          },
          {
            instruction: "Invite students to thoughtfully respond to the prompts, using insights from their Animal Genius Quiz® results",
            tips: [
              "If you'd prefer a printed version of each Animal Genius animal profile for students to reference while they work, downloadable PDFs are available in the Resource tab"
            ]
          }
        ]
      },
      activity4: {
        title: "Take Home Activity - Who's in My Family Zoo?",
        optional: true,
        steps: [
          {
            instruction: "Send home a Parent Letter introducing the Animal Genius Quiz® and explaining how it supports self-awareness and classroom culture",
            tips: [
              "Objective: extend self-awareness into the home by exploring family personality dynamics in a fun and inclusive way"
            ]
          },
          {
            instruction: "Include the 'Who's in My Family Zoo?' worksheet for students to complete with their family"
          },
          {
            instruction: "Students return and share one insight or reflection from their family discussion"
          }
        ]
      }
    }
  },
  {
    id: 2,
    title: "Building Our Classroom Community",
    duration: "45 minutes",
    description: "Students work together to create classroom norms and build a supportive community that values all personality types.",
    objectives: [
      "Students will contribute to creating classroom norms",
      "Students will understand how to support different personality types",
      "Students will practice inclusive communication"
    ],
    materialsNeeded: [
      "Poster board for classroom norms",
      "Markers and art supplies",
      "Sticky notes"
    ],
    activities: {
      activity1: {
        title: "Activity 1",
        steps: [{ instruction: "Coming soon" }]
      },
      activity2: {
        title: "Activity 2",
        steps: [{ instruction: "Coming soon" }]
      },
      activity3: {
        title: "Activity 3",
        steps: [{ instruction: "Coming soon" }]
      },
      activity4: {
        title: "Activity 4",
        steps: [{ instruction: "Coming soon" }]
      }
    }
  },
  {
    id: 3,
    title: "Understanding Your Animal Personality",
    duration: "45 minutes",
    description: "Students explore their animal personalities in depth, learning about their unique strengths and how to work with others.",
    objectives: [
      "Students will understand the characteristics of their personality animal",
      "Students will identify their personal strengths and growth areas",
      "Students will learn how different animals work together"
    ],
    materialsNeeded: [
      "Animal personality cards or printouts",
      "Strength identification worksheet",
      "Team building activity materials"
    ],
    activities: {
      activity1: {
        title: "Activity 1",
        steps: [{ instruction: "Coming soon" }]
      },
      activity2: {
        title: "Activity 2",
        steps: [{ instruction: "Coming soon" }]
      },
      activity3: {
        title: "Activity 3",
        steps: [{ instruction: "Coming soon" }]
      },
      activity4: {
        title: "Activity 4",
        steps: [{ instruction: "Coming soon" }]
      }
    }
  },
  {
    id: 4,
    title: "Create Our Pack Agreements",
    duration: "35-45 minutes",
    description: "Students will co-create their classroom agreements using shared core values. Through discussion, voting, and reflection, they'll establish a foundation of trust, collaboration, and shared expectations.",
    objectives: [
      "Students will co-create their classroom agreements using shared core values",
      "Students will participate in democratic decision-making through values voting",
      "Students will establish a foundation of trust and collaboration",
      "Students will understand how shared values support classroom community"
    ],
    materialsNeeded: [
      "Student devices for voting (Chromebooks/tablets)",
      "Projector for displaying voting session",
      "Class tree poster or digital display",
      "Optional: Leaf templates for reflection activity"
    ],
    activities: {
      activity1: {
        title: "Choose Your Roots (Core Values Discussion)",
        steps: [
          { 
            instruction: "Display the Core Values list and invite students to read each value aloud",
            tips: ["Take turns reading or read together as a class", "Ensure every student understands each value"]
          },
          { 
            instruction: "Discuss what values mean to your class community",
            guidingQuestions: ["What does this value look like in our classroom?", "How might this value help us learn together?"]
          }
        ]
      },
      activity2: {
        title: "Core Values Voting",
        steps: [
          { 
            instruction: "Launch the digital voting session for your class",
            tips: ["Project the voting URL or QR code for students to access", "Ensure all students can join before starting"]
          },
          { 
            instruction: "Students vote on their top 3 values in each of the 4 clusters",
            tips: ["Monitor live progress to ensure all students participate", "Provide gentle reminders for students who need more time"]
          },
          { 
            instruction: "Review voting results together as a class",
            guidingQuestions: ["What do our chosen values tell us about who we want to be as a class?", "How can these values guide our daily interactions?"]
          }
        ]
      },
      activity3: {
        title: "Create Class Agreements",
        steps: [
          { 
            instruction: "Use sentence starters to co-write agreements based on your class values",
            tips: ["Group values into the 4 themes", "Let students help craft the language for each agreement"]
          },
          { 
            instruction: "Vote to finalize 3-5 class agreements that everyone commits to follow",
            guidingQuestions: ["Which agreements feel most important for our class?", "How will these agreements help us all succeed?"]
          }
        ]
      },
      activity4: {
        title: "Sign the Classroom Tree (Optional)",
        optional: true,
        steps: [
          { 
            instruction: "Have each student sign their name on the classroom tree as a symbol of commitment",
            tips: ["Use the digital tree display or print a large poster version"]
          },
          { 
            instruction: "Optional: Students create leaves sharing what they need to thrive",
            guidingQuestions: ["What do you personally need to grow and learn in our classroom?", "How can our class values support your growth?"]
          }
        ]
      }
    }
  },
  {
    id: 5,
    title: "Discovering Your Genius Type",
    duration: "50 minutes",
    description: "Students explore their genius types and learn how different types of intelligence contribute to problem-solving and creativity.",
    objectives: [
      "Students will understand the concept of multiple intelligences",
      "Students will identify their genius type and its characteristics",
      "Students will explore careers and activities that match their genius type"
    ],
    materialsNeeded: [
      "Genius type descriptions and cards",
      "Intelligence exploration stations",
      "Career connection worksheets"
    ],
    activities: {
      activity1: {
        title: "Activity 1",
        steps: [{ instruction: "Coming soon" }]
      },
      activity2: {
        title: "Activity 2",
        steps: [{ instruction: "Coming soon" }]
      },
      activity3: {
        title: "Activity 3",
        steps: [{ instruction: "Coming soon" }]
      },
      activity4: {
        title: "Activity 4",
        steps: [{ instruction: "Coming soon" }]
      }
    }
  }
];

export function getLessonById(id: number): Lesson | undefined {
  return lessons.find(lesson => lesson.id === id);
}

export function getAllLessons(): Lesson[] {
  return lessons;
}
