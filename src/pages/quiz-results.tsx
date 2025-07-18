import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ANIMAL_TYPES } from "@/lib/animals";
import { getPreferenceDescription, getSchoolImplication } from "@/lib/scoring";
import { api } from "@/config/api";

interface QuizResult {
  id?: number;
  studentName: string;
  gradeLevel?: string; // Optional for backwards compatibility
  personalityType: string;
  animal: string;
  passportCode?: string;
  currencyBalance?: number;
  scores: {
    E: number; I: number;
    S: number; N: number;
    T: number; F: number;
    J: number; P: number;
  };
  preferences: {
    EI: { preference: "E" | "I"; strength: string };
    SN: { preference: "S" | "N"; strength: string };
    TF: { preference: "T" | "F"; strength: string };
    JP: { preference: "J" | "P"; strength: string };
  };
  learningStyle?: string;
  learningScores?: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    readingWriting: number;
  };
}

export default function QuizResults() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/results/:submissionId");
  const [result, setResult] = useState<QuizResult | null>(null);
  
  const submissionId = params?.submissionId;
  const isDemo = submissionId === "demo";

  // Fetch submission data for real submissions
  const { data: submissionData, isLoading, error } = useQuery({
    queryKey: [`/api/submissions/${submissionId}`],
    queryFn: async () => {
      const response = await fetch(api(`/api/submissions/${submissionId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch submission data' }));
        throw new Error(errorData.message || 'Failed to fetch submission data');
      }
      return response.json();
    },
    enabled: !!submissionId && !isDemo,
  });

  useEffect(() => {
    if (isDemo) {
      // Load demo results from sessionStorage
      const demoResults = sessionStorage.getItem("demoResults");
      if (demoResults) {
        setResult(JSON.parse(demoResults));
      } else {
        setLocation("/");
      }
    } else if (submissionData) {
      // Convert API data to expected format
      setResult({
        id: submissionData.id,
        studentName: submissionData.studentName,
        gradeLevel: submissionData.gradeLevel,
        personalityType: submissionData.personalityType,
        animal: submissionData.animalType,
        passportCode: submissionData.passportCode,
        currencyBalance: submissionData.currencyBalance,
        scores: submissionData.scores,
        preferences: calculatePreferences(submissionData.scores),
        learningStyle: submissionData.learningStyle,
        learningScores: submissionData.learningScores,
      });
    } else if (!isLoading && error) {
      // If we can't fetch from API, try sessionStorage as fallback
      const savedResults = sessionStorage.getItem('quizResults');
      if (savedResults) {
        try {
          const parsedResults = JSON.parse(savedResults);
          // Validate that parsedResults has expected properties
          if (parsedResults && parsedResults.personalityType && parsedResults.scores) {
            setResult({
              id: parsedResults.id,
              studentName: parsedResults.studentName,
              gradeLevel: parsedResults.gradeLevel,
              personalityType: parsedResults.personalityType,
              animal: parsedResults.animalType,
              passportCode: parsedResults.passportCode,
              currencyBalance: parsedResults.currencyBalance || 50,
              scores: parsedResults.scores,
              preferences: calculatePreferences(parsedResults.scores),
              learningStyle: parsedResults.learningStyle,
              learningScores: parsedResults.learningScores,
            });
          } else {
            console.error('Invalid quiz results structure in sessionStorage');
          }
        } catch (e) {
          console.error('Failed to parse quiz results from sessionStorage:', e);
        }
        // Clear the session storage after trying to use it, even if it fails
        sessionStorage.removeItem('quizResults');
      }
    }
  }, [submissionData, isDemo, setLocation, isLoading, error]);

  const calculatePreferences = (scores: any) => {
    const getStrength = (diff: number): string => {
      const absDiff = Math.abs(diff);
      if (absDiff >= 5) return "Strong";
      if (absDiff >= 3) return "Moderate";
      return "Slight";
    };

    return {
      EI: {
        preference: scores.E >= scores.I ? "E" : "I" as "E" | "I",
        strength: getStrength(scores.E - scores.I)
      },
      SN: {
        preference: scores.S >= scores.N ? "S" : "N" as "S" | "N",
        strength: getStrength(scores.S - scores.N)
      },
      TF: {
        preference: scores.T >= scores.F ? "T" : "F" as "T" | "F",
        strength: getStrength(scores.T - scores.F)
      },
      JP: {
        preference: scores.J >= scores.P ? "J" : "P" as "J" | "P",
        strength: getStrength(scores.J - scores.P)
      }
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Results Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find your quiz results. Please try taking the quiz again.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const animalData = ANIMAL_TYPES[result.animal.toLowerCase()];
  const animalColor = animalData?.color || "#6366F1";

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-block rounded-full p-4 shadow-lg mb-6"
            style={{ backgroundColor: animalColor + "20" }}
          >
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: animalColor }}
            >
              {animalData?.imagePath ? (
                <img 
                  src={animalData.imagePath} 
                  alt={animalData?.name || "Animal"}
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    // Hide image if it fails to load instead of showing fallback
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-white text-3xl font-bold">
                  {result.animal.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Congratulations, {result.studentName}!
          </h1>
          <p className="text-xl text-gray-600">You've discovered your Animal Genius type</p>
        </div>

        {/* Simplified Animal Description */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-lg text-gray-700 leading-relaxed text-center">
              {animalData?.description ? 
                `As a ${animalData.name}, ${animalData.description.toLowerCase()}` :
                `You're a unique ${result.animal} with special strengths and abilities!`
              }
            </p>
          </CardContent>
        </Card>

        {/* Animal Genius Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Your Animal Genius</h3>
            <div className="text-center">
              <div 
                className="w-24 h-24 rounded-full mx-auto shadow-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: animalColor }}
              >
                {animalData?.imagePath ? (
                  <img 
                    src={animalData.imagePath} 
                    alt={animalData?.name || "Animal"}
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-white text-4xl font-bold">
                    {result.animal.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold" style={{ color: animalColor }}>
                {animalData?.name || result.animal} - {animalData?.leadershipStyle?.[0] || "A natural leader"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Learning Style Section */}
        {result.learningStyle && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Your Learning Style</h3>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800 mb-2">
                  {result.learningStyle === 'readingWriting' ? 'Reading/Writing' : 
                   result.learningStyle.charAt(0).toUpperCase() + result.learningStyle.slice(1)} Learner
                </p>
                <p className="text-gray-700">
                  {result.learningStyle === 'visual' && "You learn best through seeing and visual aids."}
                  {result.learningStyle === 'auditory' && "You learn best through listening and discussion."}
                  {result.learningStyle === 'kinesthetic' && "You learn best through hands-on activities."}
                  {result.learningStyle === 'readingWriting' && "You learn best through reading and writing."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Passport Code */}
        {result.passportCode && (
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Your Passport Code
              </h3>
              <div className="bg-white rounded-lg px-4 py-2 inline-block border-2 border-green-300">
                <span className="font-mono text-2xl font-bold text-green-700">
                  {result.passportCode}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Save this code to access your room!
              </p>
            </CardContent>
          </Card>
        )}


        {/* Single Action Button */}
        <div className="text-center">
          <Button 
            onClick={() => {
              // TODO: Navigate to full results page
              // For now, this could go to a more detailed view or back to their room
              if (result.passportCode) {
                setLocation(`/room/${result.passportCode}`);
              }
            }} 
            className="px-8 py-4 text-lg"
            style={{ backgroundColor: animalColor }}
          >
            Read My Full Results
          </Button>
        </div>
      </div>
    </div>
  );
}
