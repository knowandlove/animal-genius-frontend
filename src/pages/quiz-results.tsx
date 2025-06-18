import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ANIMAL_TYPES } from "@/lib/animals";
import { getPreferenceDescription, getSchoolImplication } from "@/lib/scoring";

interface QuizResult {
  id?: number;
  studentName: string;
  gradeLevel: string;
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
        gradeLevel: submissionData.gradeLevel || "",
        personalityType: submissionData.personalityType,
        animal: submissionData.animalType,
        passportCode: submissionData.passportCode,
        currencyBalance: submissionData.currencyBalance,
        scores: submissionData.scores,
        preferences: calculatePreferences(submissionData.scores),
        learningStyle: submissionData.learningStyle,
        learningScores: submissionData.learningScores,
      });
    }
  }, [submissionData, isDemo, setLocation]);

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
              <img 
                src={animalData?.imagePath || "/images/kal-character.png"} 
                alt={animalData?.name || "Animal"}
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Congratulations, {result.studentName}!
          </h1>
          <p className="text-xl text-gray-600">You've discovered your Animal Genius type</p>
        </div>

        {/* Passport Code & Currency Display */}
        {result.passportCode && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    🏝️ Your Personal Island Passport
                  </h3>
                  <div className="bg-white rounded-lg px-4 py-2 inline-block border-2 border-green-300">
                    <span className="font-mono text-2xl font-bold text-green-700">
                      {result.passportCode}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Save this code to visit your island anytime!
                  </p>
                </div>
                
                {result.currencyBalance !== undefined && (
                  <div className="flex items-center gap-2 bg-yellow-100 rounded-lg px-4 py-2">
                    <span className="text-2xl">🪙</span>
                    <div>
                      <p className="font-semibold text-yellow-800">
                        {result.currencyBalance} Genius Coins
                      </p>
                      <p className="text-xs text-yellow-700">
                        Earned for completing the quiz!
                      </p>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => setLocation(`/island/${result.passportCode}`)}
                  className="mt-2"
                  size="lg"
                >
                  🏝️ Visit Your Island
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Animal Result Card */}
        <Card className="shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div 
                  className="w-32 h-32 rounded-full mx-auto shadow-lg flex items-center justify-center mb-6"
                  style={{ backgroundColor: animalColor }}
                >
                  <img 
                    src={animalData?.imagePath || "/images/kal-character.png"} 
                    alt={animalData?.name || "Animal"}
                    className="w-24 h-24 object-contain"
                  />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                You're {animalData?.name ? `a ${animalData.name}` : result.animal}!
              </h2>
              <p className="text-lg font-semibold mb-4" style={{ color: animalColor }}>
                {animalData?.description || `The ${result.personalityType} Type`}
              </p>
              <div 
                className="rounded-xl p-4"
                style={{ backgroundColor: animalColor + "10" }}
              >
                <p className="text-gray-700 font-medium">
                  "You bring unique strengths and perspectives to every situation, making you an invaluable part of any team!"
                </p>
              </div>
            </div>

            {/* Personality Details */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">❤️</span>Your Strengths
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {animalData?.traits.map((trait, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-accent mr-2 mt-1">✓</span>
                      {trait}
                    </li>
                  )) || (
                    <li className="text-gray-600">
                      Your unique {result.personalityType} personality brings valuable strengths to every situation.
                    </li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">👑</span>Leadership Style
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {animalData?.leadershipStyle.map((style, index) => (
                    <li key={index} className="flex items-start">
                      <span style={{ color: animalColor }} className="mr-2 mt-1">★</span>
                      {style}
                    </li>
                  )) || (
                    <li className="text-gray-600">
                      You lead in your own unique way, bringing out the best in yourself and others.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Thinking Style */}
            {animalData?.thinkingStyle && (
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🧠</span>Your Thinking Style
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {animalData.thinkingStyle}
                </p>
              </div>
            )}

            {/* Learning Style Section */}
            {result.learningStyle && (
              <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🎓</span>Your Learning Style
                </h3>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {result.learningStyle === 'readingWriting' ? 'Reading/Writing Learner' : 
                     result.learningStyle.charAt(0).toUpperCase() + result.learningStyle.slice(1) + ' Learner'}
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {result.learningStyle === 'visual' && "You learn best through seeing and visual aids like charts, diagrams, and pictures."}
                    {result.learningStyle === 'auditory' && "You learn best through listening and discussion, enjoying lectures and verbal instructions."}
                    {result.learningStyle === 'kinesthetic' && "You learn best through hands-on activities and movement, preferring to learn by doing."}
                    {result.learningStyle === 'readingWriting' && "You learn best through reading and writing activities, enjoying text-based information."}
                  </p>
                </div>
                {result.learningScores && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{result.learningScores.visual}</div>
                      <div className="text-sm text-gray-600">Visual</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{result.learningScores.auditory}</div>
                      <div className="text-sm text-gray-600">Auditory</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{result.learningScores.kinesthetic}</div>
                      <div className="text-sm text-gray-600">Kinesthetic</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{result.learningScores.readingWriting}</div>
                      <div className="text-sm text-gray-600">Reading/Writing</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Habitat Description */}
            {animalData?.habitat && (
              <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🏠</span>Your Natural Habitat
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {animalData.habitat}
                </p>
              </div>
            )}

            {/* Personality Type Details */}
            <div className="mt-8 bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Personality Type: {result.personalityType}</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p><strong>Extroversion/Introversion:</strong> {result.preferences.EI.preference} ({result.preferences.EI.strength})</p>
                  <p><strong>Sensing/Intuition:</strong> {result.preferences.SN.preference} ({result.preferences.SN.strength})</p>
                </div>
                <div className="space-y-2">
                  <p><strong>Thinking/Feeling:</strong> {result.preferences.TF.preference} ({result.preferences.TF.strength})</p>
                  <p><strong>Judging/Perceiving:</strong> {result.preferences.JP.preference} ({result.preferences.JP.strength})</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setLocation("/")} 
              className="px-8 py-4 text-lg"
              style={{ backgroundColor: animalColor }}
            >
              Take Quiz Again
            </Button>
            <Button 
              onClick={() => window.print()} 
              variant="outline" 
              className="px-8 py-4 text-lg"
            >
              <span className="mr-2">🖨️</span>Print Results
            </Button>
          </div>
          {!isDemo && (
            <p className="text-sm text-gray-600">
              Your teacher will be able to see these results in their dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
