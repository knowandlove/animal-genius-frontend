// Temporary scoring functions to fix build - will be consolidated
export function getPreferenceDescription(preference: string, strength: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    'E': {
      'Strong': 'You strongly prefer being around people and gain energy from social interaction.',
      'Moderate': 'You generally enjoy being around others and social activities.',
      'Slight': 'You have a mild preference for social interaction over solitude.'
    },
    'I': {
      'Strong': 'You strongly prefer quiet reflection and gain energy from solitude.',
      'Moderate': 'You generally prefer smaller groups and quiet environments.',
      'Slight': 'You have a mild preference for solitude over large social gatherings.'
    },
    'S': {
      'Strong': 'You strongly prefer concrete facts and practical details.',
      'Moderate': 'You generally focus on present realities and practical applications.',
      'Slight': 'You have a mild preference for concrete information over abstract concepts.'
    },
    'N': {
      'Strong': 'You strongly prefer patterns, possibilities, and future potential.',
      'Moderate': 'You generally enjoy exploring ideas and theoretical concepts.',
      'Slight': 'You have a mild preference for big-picture thinking over details.'
    },
    'T': {
      'Strong': 'You strongly prefer logical analysis and objective decision-making.',
      'Moderate': 'You generally value logic and fairness in decisions.',
      'Slight': 'You have a mild preference for analytical thinking.'
    },
    'F': {
      'Strong': 'You strongly prefer considering people and values in decisions.',
      'Moderate': 'You generally value harmony and personal considerations.',
      'Slight': 'You have a mild preference for value-based decision making.'
    },
    'J': {
      'Strong': 'You strongly prefer structure, planning, and closure.',
      'Moderate': 'You generally like organization and having things decided.',
      'Slight': 'You have a mild preference for planning over spontaneity.'
    },
    'P': {
      'Strong': 'You strongly prefer flexibility, spontaneity, and keeping options open.',
      'Moderate': 'You generally enjoy adaptability and exploring possibilities.',
      'Slight': 'You have a mild preference for flexibility over rigid planning.'
    }
  };

  return descriptions[preference]?.[strength] || `You show a ${strength.toLowerCase()} preference for ${preference}.`;
}

export function getSchoolImplication(preference: string, strength: string): string {
  const implications: Record<string, Record<string, string>> = {
    'E': {
      'Strong': 'You learn best through group discussions, presentations, and collaborative projects.',
      'Moderate': 'You benefit from both group work and individual study time.',
      'Slight': 'You enjoy some group activities but also value quiet study time.'
    },
    'I': {
      'Strong': 'You learn best through independent study, reading, and reflection time.',
      'Moderate': 'You prefer smaller group work and need quiet spaces to process information.',
      'Slight': 'You benefit from a mix of individual and small group learning activities.'
    },
    'S': {
      'Strong': 'You learn best with concrete examples, hands-on activities, and step-by-step instructions.',
      'Moderate': 'You prefer practical applications and real-world examples in learning.',
      'Slight': 'You benefit from both concrete examples and some theoretical concepts.'
    },
    'N': {
      'Strong': 'You learn best through creative projects, brainstorming, and exploring possibilities.',
      'Moderate': 'You enjoy learning about connections between ideas and future implications.',
      'Slight': 'You benefit from both theoretical concepts and practical applications.'
    },
    'T': {
      'Strong': 'You learn best when information is presented logically with clear reasoning.',
      'Moderate': 'You prefer objective analysis and fair evaluation methods.',
      'Slight': 'You benefit from both logical explanations and consideration of different perspectives.'
    },
    'F': {
      'Strong': 'You learn best in supportive environments that consider personal values and impact on people.',
      'Moderate': 'You prefer learning that connects to personal meaning and human experiences.',
      'Slight': 'You benefit from both analytical content and personal relevance.'
    },
    'J': {
      'Strong': 'You learn best with clear deadlines, structured assignments, and organized materials.',
      'Moderate': 'You prefer having a clear plan and knowing what to expect.',
      'Slight': 'You benefit from some structure while maintaining some flexibility.'
    },
    'P': {
      'Strong': 'You learn best with flexible deadlines, varied activities, and open-ended projects.',
      'Moderate': 'You prefer having options and the ability to adapt your approach.',
      'Slight': 'You benefit from some flexibility within a generally structured environment.'
    }
  };

  return implications[preference]?.[strength] || `In school, your ${preference} preference suggests you work well with ${strength.toLowerCase()} ${preference}-oriented approaches.`;
}