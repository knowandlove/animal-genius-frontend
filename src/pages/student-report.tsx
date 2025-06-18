import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import { ANIMAL_TYPES } from "@/lib/animals";
import { getPreferenceDescription, getSchoolImplication } from "@/lib/scoring";
import { useToast } from "@/hooks/use-toast";

// Animal Genius details
const animalGeniusDetails = {
  'Thinker': {
    name: 'Thinker',
    description: 'Strategic minds who excel at innovative problem-solving',
    strengths: ['Creative Thinking', 'Originality', 'Critical Thinking & Ethical Reasoning', 'Vision and Strategic Foresight'],
    color: '#8B5CF6',
    emoji: '🧠'
  },
  'Feeler': {
    name: 'Feeler', 
    description: 'Emotionally intelligent leaders who build strong connections',
    strengths: ['Emotional Intelligence', 'Empathy', 'Relationship Building', 'Communication', 'Inclusion and Moral Courage'],
    color: '#10B981',
    emoji: '💝'
  },
  'Doer': {
    name: 'Doer',
    description: 'Action-oriented individuals who drive results and adapt quickly',
    strengths: ['Resilience', 'Flexibility', 'Growth Mindset', 'Learning Agility', 'Leadership and Team Motivation'],
    color: '#F59E0B',
    emoji: '⚡'
  }
};

// Learning style details
const learningStyleDetails = {
  'visual': {
    name: 'Visual Learner',
    description: 'You learn best through visual aids, diagrams, charts, and seeing information presented graphically.',
    tips: ['Use colorful notes and highlights', 'Create mind maps and diagrams', 'Watch educational videos', 'Use flashcards with images'],
    emoji: '👁️',
    color: '#4F46E5'
  },
  'auditory': {
    name: 'Auditory Learner',
    description: 'You learn best through listening, discussions, and verbal explanations.',
    tips: ['Listen to recorded lectures', 'Participate in group discussions', 'Read aloud to yourself', 'Use music or rhymes to remember'],
    emoji: '👂',
    color: '#059669'
  },
  'kinesthetic': {
    name: 'Kinesthetic Learner', 
    description: 'You learn best through hands-on activities, movement, and physical engagement.',
    tips: ['Use hands-on experiments', 'Take frequent breaks to move', 'Use manipulatives and models', 'Study while walking or standing'],
    emoji: '🤲',
    color: '#DC2626'
  },
  'readingWriting': {
    name: 'Reading/Writing Learner',
    description: 'You learn best through reading, writing, and text-based materials.',
    tips: ['Take detailed written notes', 'Read extensively on topics', 'Write summaries and outlines', 'Use lists and written instructions'],
    emoji: '📚',
    color: '#7C2D12'
  }
};

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface SubmissionData {
  id: number;
  studentName: string;
  gradeLevel: string;
  personalityType: string;
  animalType: string;
  animalGenius: string;
  learningStyle: string;
  learningScores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    readingWriting: number;
  };
  scores: {
    E: number; I: number;
    S: number; N: number;
    T: number; F: number;
    J: number; P: number;
  };
  completedAt: string;
  class: {
    id: number;
    name: string;
    code: string;
  };
}

export default function StudentReport() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/submission/:submissionId/report");
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  const submissionId = params?.submissionId;

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLocation("/login");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [setLocation]);

  const { data: submission, isLoading, error } = useQuery<SubmissionData>({
    queryKey: [`/api/submissions/${submissionId}`],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/submissions/${submissionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch submission data");
      }
      return response.json();
    },
    enabled: !!submissionId && !!user,
  });

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    
    // Dispatch custom event to update router state
    window.dispatchEvent(new Event('authTokenChanged'));
    
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header isAuthenticated={true} user={user ? { firstName: user.firstName, lastName: user.lastName } : undefined} onLogout={handleLogout} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading student report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen">
        <Header isAuthenticated={true} user={user ? { firstName: user.firstName, lastName: user.lastName } : undefined} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">❌</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find this student report. Please check your access permissions.
              </p>
              <Button onClick={() => setLocation("/dashboard")} className="w-full">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const animalData = ANIMAL_TYPES[submission.animalType.toLowerCase()];
  const animalColor = animalData?.color || "#6366F1";

  // Calculate preferences with strength
  const calculatePreferences = () => {
    const getStrength = (diff: number): string => {
      const absDiff = Math.abs(diff);
      if (absDiff >= 5) return "Strong";
      if (absDiff >= 3) return "Moderate";
      return "Slight";
    };

    return {
      EI: {
        preference: submission.scores.E >= submission.scores.I ? "E" : "I",
        strength: getStrength(submission.scores.E - submission.scores.I),
        score: submission.scores.E >= submission.scores.I ? submission.scores.E : submission.scores.I
      },
      SN: {
        preference: submission.scores.S >= submission.scores.N ? "S" : "N",
        strength: getStrength(submission.scores.S - submission.scores.N),
        score: submission.scores.S >= submission.scores.N ? submission.scores.S : submission.scores.N
      },
      TF: {
        preference: submission.scores.T >= submission.scores.F ? "T" : "F",
        strength: getStrength(submission.scores.T - submission.scores.F),
        score: submission.scores.T >= submission.scores.F ? submission.scores.T : submission.scores.F
      },
      JP: {
        preference: submission.scores.J >= submission.scores.P ? "J" : "P",
        strength: getStrength(submission.scores.J - submission.scores.P),
        score: submission.scores.J >= submission.scores.P ? submission.scores.J : submission.scores.P
      }
    };
  };

  const preferences = calculatePreferences();
  const wildcardDimension = animalData?.wildcardDichotomy;

  return (
    <div className="min-h-screen">
      <Header isAuthenticated={true} user={user ? { firstName: user.firstName, lastName: user.lastName } : undefined} onLogout={handleLogout} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Controls */}
        <Card className="mb-4 print:hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setLocation("/dashboard")}
                variant="outline"
                className="flex items-center gap-2"
              >
                ← Back to Dashboard
              </Button>
              <Button onClick={() => window.print()} variant="outline">
                <span className="mr-2">🖨️</span>Print Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Report Card */}
        <Card className="shadow-xl print:shadow-none">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Animal Genius Report</h1>
              <p className="text-gray-600">Individual Personality Assessment Results</p>
            </div>

            {/* Student Info */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Student Information</h2>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {submission.studentName}</p>
                  <p><strong>Grade:</strong> {submission.gradeLevel || "N/A"}</p>
                  <p><strong>Class:</strong> {submission.class?.name || "N/A"}</p>
                  <p><strong>Date:</strong> {new Date(submission.completedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-block">
                  <div 
                    className="w-24 h-24 rounded-full mx-auto shadow-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: animalColor }}
                  >
                    <img 
                      src={animalData?.imagePath || "/images/kal-character.png"} 
                      alt={animalData?.name || "Animal"}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{submission.animalType}</h3>
                  <p className="text-lg font-semibold" style={{ color: animalColor }}>
                    {animalData?.description.split(" - ")[0] || "The Unique Individual"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Personality Types: <span className="font-mono">{animalData?.personalityTypes.join(", ") || submission.personalityType}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Complete Profile</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Animal Genius Section */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 border shadow-sm">
                  <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Animal Genius Leadership Style</h3>
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">
                      {animalGeniusDetails[submission?.animalGenius as keyof typeof animalGeniusDetails]?.emoji}
                    </div>
                    <h4 className="text-2xl font-bold mb-3" style={{color: animalGeniusDetails[submission?.animalGenius as keyof typeof animalGeniusDetails]?.color}}>
                      {submission?.animalGenius}
                    </h4>
                    <p className="text-gray-600 mb-6">
                      {animalGeniusDetails[submission?.animalGenius as keyof typeof animalGeniusDetails]?.description}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-lg mb-4 text-center">Your Leadership Strengths:</h5>
                    <ul className="space-y-3">
                      {animalGeniusDetails[submission?.animalGenius as keyof typeof animalGeniusDetails]?.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-3 mt-1">•</span>
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Learning Style Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-8 border shadow-sm">
                  <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Learning Style Preferences</h3>
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">
                      {learningStyleDetails[submission?.learningStyle as keyof typeof learningStyleDetails]?.emoji}
                    </div>
                    <h4 className="text-2xl font-bold mb-3" style={{color: learningStyleDetails[submission?.learningStyle as keyof typeof learningStyleDetails]?.color}}>
                      {learningStyleDetails[submission?.learningStyle as keyof typeof learningStyleDetails]?.name}
                    </h4>
                    <p className="text-gray-600 mb-6">
                      {learningStyleDetails[submission?.learningStyle as keyof typeof learningStyleDetails]?.description}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-lg mb-4 text-center">Study Tips for You:</h5>
                    <ul className="space-y-3">
                      {learningStyleDetails[submission?.learningStyle as keyof typeof learningStyleDetails]?.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-3 mt-1">•</span>
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            </div>

            {/* Detailed Preference Breakdown */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Personality Preference Breakdown</h2>
              <div className="space-y-6">
                {/* Extroversion/Introversion */}
                <div 
                  className="border-2 rounded-xl p-6"
                  style={{ 
                    backgroundColor: "#3B82F610",
                    borderColor: "#3B82F630"
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {preferences.EI.preference === "E" ? "Extroversion (E)" : "Introversion (I)"}
                    </h3>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: "#3B82F6" }}
                    >
                      {preferences.EI.strength} Preference
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    {getPreferenceDescription("EI", preferences.EI.preference)}
                  </p>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>In school, this means:</strong> {getSchoolImplication("EI", preferences.EI.preference)}
                    </p>
                  </div>
                </div>

                {/* Sensing/Intuition */}
                <div 
                  className={`border-2 rounded-xl p-6 ${
                    wildcardDimension === "S/N" ? "ring-2 ring-yellow-400" : ""
                  }`}
                  style={{ 
                    backgroundColor: "#10B98110",
                    borderColor: "#10B98130"
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {preferences.SN.preference === "S" ? "Sensing (S)" : "Intuition (N)"}
                    </h3>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: "#10B981" }}
                    >
                      {preferences.SN.strength} Preference
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    {getPreferenceDescription("SN", preferences.SN.preference)}
                  </p>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-emerald-700">
                      <strong>In school, this means:</strong> {getSchoolImplication("SN", preferences.SN.preference)}
                    </p>
                  </div>
                  {wildcardDimension === "S/N" && (
                    <div className="mt-3 bg-yellow-100 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>⭐ Wildcard Dimension:</strong> This preference most distinguishes your {submission.animalType} type from similar personalities! This could also be {preferences.SN.preference === "S" ? "Intuition (N)" : "Sensing (S)"}.
                      </p>
                    </div>
                  )}
                </div>

                {/* Thinking/Feeling */}
                <div 
                  className={`border-2 rounded-xl p-6 ${
                    wildcardDimension === "T/F" ? "ring-2 ring-yellow-400" : ""
                  }`}
                  style={{ 
                    backgroundColor: "#EC489610",
                    borderColor: "#EC489630"
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {preferences.TF.preference === "T" ? "Thinking (T)" : "Feeling (F)"}
                    </h3>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: "#EC4899" }}
                    >
                      {preferences.TF.strength} Preference
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    {getPreferenceDescription("TF", preferences.TF.preference)}
                  </p>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-pink-700">
                      <strong>In school, this means:</strong> {getSchoolImplication("TF", preferences.TF.preference)}
                    </p>
                  </div>
                  {wildcardDimension === "T/F" && (
                    <div className="mt-3 bg-yellow-100 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>⭐ Wildcard Dimension:</strong> This preference most distinguishes your {submission.animalType} type from similar personalities! This could also be {preferences.TF.preference === "T" ? "Feeling (F)" : "Thinking (T)"}.
                      </p>
                    </div>
                  )}
                </div>

                {/* Judging/Perceiving */}
                <div 
                  className={`border-2 rounded-xl p-6 ${
                    wildcardDimension === "J/P" ? "ring-2 ring-yellow-400" : ""
                  }`}
                  style={{ 
                    backgroundColor: "#8B5CF610",
                    borderColor: "#8B5CF630"
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {preferences.JP.preference === "J" ? "Judging (J)" : "Perceiving (P)"}
                    </h3>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: "#8B5CF6" }}
                    >
                      {preferences.JP.strength} Preference
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    {getPreferenceDescription("JP", preferences.JP.preference)}
                  </p>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-purple-700">
                      <strong>In school, this means:</strong> {getSchoolImplication("JP", preferences.JP.preference)}
                    </p>
                  </div>
                  {wildcardDimension === "J/P" && (
                    <div className="mt-3 bg-yellow-100 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>⭐ Wildcard Dimension:</strong> This preference most distinguishes your {submission.animalType} type from similar personalities! This could also be {preferences.JP.preference === "J" ? "Perceiving (P)" : "Judging (J)"}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Recommendations */}
            {animalData && (
              <div className="mb-8 bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Environment & Recommendations</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Best Learning Environment</h3>
                    <p className="text-sm text-gray-600">{animalData.habitat}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Thinking Style</h3>
                    <p className="text-sm text-gray-600">{animalData.thinkingStyle}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">Generated by Animal Genius Quiz System • www.knowandlove.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Back Navigation */}
        <div className="mt-8 text-center print:hidden">
          <Button 
            variant="ghost" 
            onClick={() => {
              if (submission?.class?.id) {
                setLocation(`/class/${submission.class.id}/analytics`);
              } else {
                setLocation('/dashboard');
              }
            }}
          >
            <span className="mr-2">←</span>Back to Class Results
          </Button>
        </div>
      </div>
    </div>
  );
}
