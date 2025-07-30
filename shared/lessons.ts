export interface Lesson {
  id: number;
  title: string;
  duration: string;
  description: string;
  objectives: string[];
  materialsNeeded: string[];
  videos?: {
    teacher?: string;  // Vimeo ID for teacher prep video
    student?: string;  // Vimeo ID for student-facing video
  };
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
    videos: {
      teacher: "1106551524"
    },
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
    title: "Build Our Habitat",
    duration: "50-60 minutes",
    description: "Students gather with others who share their Animal Genius type to co-create a visual 'home' on Personality Island—a space where they feel seen, safe, and understood. Through this creative collaboration, students begin to recognize the common strengths, preferences, and needs of their personality group, building connection and belonging.",
    objectives: [
      "Students will identify shared characteristics, perspectives, and emotional needs within their animal group",
      "Students will practice cooperative planning and shared decision-making",
      "Students will create a visual representation of their group's ideal habitat",
      "Students will present their collaborative work to build class community"
    ],
    materialsNeeded: [
      "Large poster paper or 11x17 blank paper (1 per group)",
      "Markers, crayons, colored pencils",
      "Habitat Inspiration Questions (printable or projected)",
      "Optional: Additional art supplies for decoration"
    ],
    activities: {
      activity1: {
        title: "Form Animal Groups & Begin Habitat Design",
        steps: [
          {
            instruction: "Group students by their Animal Genius type",
            tips: [
              "If a student is the only one of their animal type, encourage them to design their home independently",
              "For solo students who prefer to join a group, use these pairings: Meerkat/Owl, Otter/Parrot, Panda/Beaver, Elephant/Border Collie"
            ]
          },
          {
            instruction: "Explain that their goal is to build a shared habitat home for their group to live in on Personality Island",
            tips: [
              "Emphasize this home is for them as humans to live in, not for their actual animal",
              "They can include elements inspired by their animal's habitat (like treehouses for Owls), but the home should feel like it belongs to them as people"
            ]
          },
          {
            instruction: "Distribute 1 poster per group and ensure students have creative supplies",
            tips: [
              "Have markers, crayons, and colored pencils readily available",
              "Consider playing soft background music to encourage creativity"
            ]
          },
          {
            instruction: "Provide the Habitat Inspiration Questions to guide their discussion",
            tips: [
              "You can print one copy per group or project the questions on the board",
              "Questions help spark ideas about what their group needs to feel safe, happy, and able to thrive"
            ],
            guidingQuestions: [
              "What's the big idea behind your home?",
              "What does your group need to feel safe and happy?",
              "How will your home show who you are and what's important to your personality?",
              "What special features will help your group thrive?"
            ]
          }
        ]
      },
      activity2: {
        title: "Collaborative Drawing & Design",
        steps: [
          {
            instruction: "Give groups 20-30 minutes to draw, talk, and collaborate on their habitat design",
            tips: [
              "Walk around and listen to group discussions",
              "Offer encouragement and ask clarifying questions",
              "Remind groups that each member needs their own room in the habitat"
            ]
          },
          {
            instruction: "Give a 5-minute warning before presentations to help groups wrap up",
            tips: [
              "This helps groups finalize their ideas and prepare to share",
              "Encourage groups to decide who will present which parts"
            ]
          }
        ]
      },
      activity3: {
        title: "Group Presentations & Reflection",
        steps: [
          {
            instruction: "Give each group 2 minutes to present their habitat home to the class",
            tips: [
              "Create a supportive atmosphere for presentations",
              "Encourage active listening and appreciation",
              "Note interesting patterns or unique features each group includes"
            ]
          },
          {
            instruction: "Lead a brief reflection discussion after all presentations",
            guidingQuestions: [
              "What did you notice about how different groups designed their homes?",
              "How did each group's personality show up in their designs?",
              "What similarities or differences did you observe between habitats?"
            ]
          },
          {
            instruction: "Hang the habitat posters on the wall as ongoing visual culture-builders",
            tips: [
              "These serve as important references throughout the year",
              "Students can refer back to understand what each group needs to thrive"
            ]
          }
        ]
      },
      activity4: {
        title: "Optional Extension: Individual Room Preview",
        optional: true,
        steps: [
          {
            instruction: "If time allows, have students sketch their individual room within their group's habitat",
            tips: [
              "This creates excitement for Lesson 5 when they'll design their rooms digitally",
              "Keep sketches simple - just a quick preview of their personal space"
            ]
          },
          {
            instruction: "Students can share one thing they'd include in their personal room",
            guidingQuestions: [
              "What's one special feature you'd want in your room?",
              "How would your room reflect your personality within the group habitat?"
            ]
          }
        ]
      }
    }
  },
  {
    id: 3,
    title: "Learn Our Differences",
    duration: "45-60 minutes",
    description: "Students will explore their preferences and visually represent their individuality by creating a shape on a graph, learning how each person—though similar in personality—still brings unique qualities to the classroom.",
    objectives: [
      "Students will recognize their individual likes, values, and tendencies",
      "Students will appreciate how differences contribute to group diversity—even within shared traits",
      "Students will create a visual representation of their preferences using coordinate graphing",
      "Students will compare and contrast patterns within their animal groups"
    ],
    materialsNeeded: [
      "Grade-specific Coordinate Graph worksheets (4-5 or 6th grade version)",
      "Crayons or colored pencils (with all 8 animal colors available)",
      "Space to display finished graphs by animal group",
      "Optional: Document camera or projector for demonstration"
    ],
    activities: {
      activity1: {
        title: "Our Unique Preferences - Graphing Activity",
        steps: [
          {
            instruction: "Play the student-facing math video with Mrs. Bush explaining coordinate planes",
            tips: [
              "Pause the video if students need extra time to understand concepts",
              "Consider demonstrating on the board alongside the video"
            ]
          },
          {
            instruction: "Pass out the correct worksheet based on grade level",
            tips: [
              "Grade 4-5: Positive X/Y axis graph only",
              "Grade 6: Four-quadrant coordinate plane with negative values",
              "Have extra copies available for mistakes"
            ]
          },
          {
            instruction: "Have students read each pair of preference statements and cross off the option that doesn't feel like them",
            tips: [
              "Emphasize there are no right or wrong answers",
              "Encourage students to go with their first instinct",
              "Students will use the coordinates of the option they keep"
            ]
          },
          {
            instruction: "Students plot their points on the graph in the order they appear",
            tips: [
              "Remind students: X-axis first (across), then Y-axis (up/down)",
              "For 6th graders: negative numbers mean go left or down",
              "Check in with students who might be struggling with coordinate plotting"
            ]
          },
          {
            instruction: "Students connect the points in order to create a unique shape or pattern",
            tips: [
              "Use a ruler for straight lines if available",
              "The shape should be closed (connect the last point back to the first)"
            ]
          },
          {
            instruction: "Students color their Personality Pattern using their animal's specific color",
            tips: [
              "Owls = Red, Meerkats = Orange, Otters = Yellow, Elephants = Green",
              "Pandas = Blue, Beavers = Purple, Parrots = Pink, Border Collies = Black",
              "Post the color key where all students can see it"
            ]
          }
        ]
      },
      activity2: {
        title: "Gallery Walk & Reflection",
        steps: [
          {
            instruction: "Group and display student graphs by Animal Genius type",
            tips: [
              "Create clearly labeled sections for each animal group",
              "Consider using wall space or table groupings",
              "This visual grouping helps students see patterns within their type"
            ]
          },
          {
            instruction: "Lead a Gallery Walk where students quietly observe all the graphs",
            tips: [
              "Set expectations for respectful viewing",
              "Give students 5-7 minutes to walk and observe",
              "Encourage them to look at both their own animal group and others"
            ],
            guidingQuestions: [
              "What do you notice about the personality patterns within the same animal group?",
              "How are the shapes similar? How are they different?",
              "Which animal groups seem to have the most variety in their shapes?"
            ]
          }
        ]
      },
      activity3: {
        title: "Class Discussion & Application",
        steps: [
          {
            instruction: "Facilitate a whole-class discussion about the patterns students observed",
            guidingQuestions: [
              "Why do you think every shape looks different, even within the same animal group?",
              "What does this activity tell us about how we're similar and different?",
              "How might understanding our preferences help us in group work?",
              "When might it be helpful to work with someone who has different preferences?"
            ]
          },
          {
            instruction: "Connect the activity to future classroom collaboration",
            tips: [
              "Explain how you'll use this information for future group work",
              "Emphasize that differences make teams stronger",
              "Preview how understanding preferences will help with leadership roles"
            ]
          }
        ]
      },
      activity4: {
        title: "Optional Extension: Preference Interview",
        optional: true,
        steps: [
          {
            instruction: "Pair students from different animal groups for preference interviews",
            tips: [
              "Provide 2-3 interview questions about learning preferences",
              "This helps students practice appreciating differences directly"
            ]
          },
          {
            instruction: "Students share one surprising thing they learned about their partner",
            guidingQuestions: [
              "What preference surprised you most about your partner?",
              "How might you work together effectively knowing these differences?"
            ]
          }
        ]
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
    title: "Activating our Ecosystem",
    duration: "30 minutes",
    description: "Students will launch a classroom economy by earning and managing digital coins to contribute to their 'room' in their Habitat Home. They'll be assigned class jobs, gain responsibility, practice collaboration, and learn how their contributions shape the class ecosystem.",
    objectives: [
      "Students will understand the classroom economy system and their role within it",
      "Students will apply for and receive classroom jobs with specific responsibilities",
      "Students will learn to manage digital coins through earning and spending",
      "Students will practice collaboration and responsibility through their job roles"
    ],
    materialsNeeded: [
      "Student devices (computers/tablets) for accessing rooms",
      "Projector to display job list and economy overview",
      "Optional: Google Form for job applications",
      "Optional: Post-it notes for job preference voting"
    ],
    activities: {
      activity1: {
        title: "Introduce Classroom Jobs & Economy",
        steps: [
          {
            instruction: "Project the pre-created classroom jobs list on the board",
            tips: [
              "Jobs should be added to the system before the lesson",
              "Include job descriptions and pay rates for each position",
              "Consider having a variety of jobs to match different interests and abilities"
            ]
          },
          {
            instruction: "Discuss each job, its responsibilities, and pay rate with the class",
            tips: [
              "Explain how the classroom economy mirrors real-world systems",
              "Emphasize that everyone has an important role to play",
              "Connect jobs to the class agreements created in Lesson 4"
            ],
            guidingQuestions: [
              "Why do you think this job is important for our classroom?",
              "How does this job help our classroom ecosystem thrive?",
              "What skills might you develop by doing this job?"
            ]
          },
          {
            instruction: "Explain how students will earn and track their coins",
            tips: [
              "Show how to access their room and check coin balance",
              "Explain automatic payroll system",
              "Mention bonus coins for living out class values"
            ]
          }
        ]
      },
      activity2: {
        title: "Job Application & Assignment Process",
        steps: [
          {
            instruction: "Choose and implement a job application method",
            tips: [
              "Post-it notes: Students write top 3 job choices",
              "Google Form: Students submit preferences digitally",
              "Random assignment: Draw names from a hat",
              "Teacher selection: Assign based on student strengths",
              "Choose what works best for your classroom dynamics"
            ]
          },
          {
            instruction: "Collect job preferences from all students",
            tips: [
              "Give students time to think about their choices",
              "Remind them that jobs can rotate throughout the year",
              "Consider pausing here to assign jobs during recess/after school"
            ]
          },
          {
            instruction: "Announce job assignments to the class",
            tips: [
              "Build excitement around each role",
              "If multiple students have the same job, identify them as a team",
              "Ensure every student has at least one job"
            ]
          }
        ]
      },
      activity3: {
        title: "Job Training & Collaboration",
        steps: [
          {
            instruction: "Allow students with the same job to meet and collaborate",
            tips: [
              "Give groups 5-7 minutes to discuss their strategy",
              "Encourage them to brainstorm how to excel at their job",
              "This builds teamwork and shared responsibility"
            ],
            guidingQuestions: [
              "How can we work together to do this job really well?",
              "What system should we create to make sure the job gets done?",
              "How will we communicate with each other about our job?"
            ]
          },
          {
            instruction: "Provide specific training for jobs that need it",
            tips: [
              "Jobs like 'class pet caretaker' or 'teacher assistant' may need direct instruction",
              "Model the expected behavior for complex jobs",
              "Set clear expectations for job performance"
            ]
          }
        ]
      },
      activity4: {
        title: "Activate the Economy & First Transactions",
        steps: [
          {
            instruction: "Show students how to log into their rooms using their passport codes",
            tips: [
              "Demonstrate on the projector if possible",
              "Have students practice logging in",
              "Help those who need assistance"
            ]
          },
          {
            instruction: "Guide students through checking their coin balance and job information",
            tips: [
              "Point out where they can see their job title and pay rate",
              "Show the transaction history feature",
              "Explain that coins will be added based on the payroll schedule"
            ]
          },
          {
            instruction: "Introduce the spending options available in their rooms",
            tips: [
              "Show how to access the store for room decorations",
              "Mention future options like digital pets",
              "Explain any 'real world' rewards in the Other category"
            ],
            guidingQuestions: [
              "What's the first thing you want to save up for?",
              "How will you make your room reflect your personality?",
              "What does it mean to be responsible with your coins?"
            ]
          },
          {
            instruction: "Set expectations for the ongoing economy system",
            tips: [
              "Explain when payroll will run (daily/weekly)",
              "Remind students this is about building trust and responsibility",
              "Emphasize that coins are earned, never taken away as punishment"
            ]
          }
        ]
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
