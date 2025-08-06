import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { apiRequest } from '@/lib/queryClient';
import { getStoredPassportCode } from '@/lib/passport-auth';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ANIMAL_TYPES } from '@/lib/animals';
import { StudentHeader } from '@/components/StudentHeader';

interface QuizResultsData {
  student: {
    id: string;
    name: string;
    animalType: string;
    geniusType: string;
    personalityType: string;
    learningStyle: string;
    scores?: {
      E: number;
      I: number;
      S: number;
      N: number;
      T: number;
      F: number;
      J: number;
      P: number;
    };
    learningScores?: {
      visual: number;
      auditory: number;
      kinesthetic: number;
      readingWriting: number;
    };
  };
}

export default function StudentQuizResults() {
  const [location, setLocation] = useLocation();
  const passportCode = getStoredPassportCode();

  // Fetch quiz results data
  const { data, isLoading, error } = useQuery<QuizResultsData>({
    queryKey: ['/api/student-passport/quiz-results', passportCode],
    queryFn: async () => {
      return apiRequest('GET', '/api/student-passport/quiz-results', undefined, {
        headers: {
          'X-Passport-Code': passportCode || '',
        },
      });
    },
    enabled: !!passportCode,
  });

  const handleBack = () => {
    setLocation('/student/dashboard');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    // Could implement sharing functionality
    alert('Sharing coming soon!');
  };

  if (!passportCode) {
    setLocation('/student-login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint/20 to-soft-lime/20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint/20 to-soft-lime/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Quiz Results Not Found</CardTitle>
            <CardDescription>
              We couldn't find your quiz results. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBack} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student } = data;
  const animal = ANIMAL_TYPES[student.animalType] || {
    name: student.animalType,
    imagePath: '/images/default-animal.svg',
    description: `You have the personality traits of a ${student.animalType}!`,
    traits: [],
    emoji: '🐾',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint/20 to-soft-lime/20">
      {/* Student Header */}
      <StudentHeader />
      
      {/* Page Navigation */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="mb-4 flex justify-center">
                <img
                  src={animal.imagePath}
                  alt={animal.name}
                  className="w-32 h-32 object-contain"
                />
              </div>
              <CardTitle className="text-3xl">
                You're a {student.animalType}!
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                {animal.description}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Personality Type */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Personality Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <Badge className="text-2xl px-4 py-2">
                  {student.personalityType}
                </Badge>
              </div>
              
              {student.scores && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Extroversion (E)</span>
                      <span className="font-mono">{student.scores.E}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sensing (S)</span>
                      <span className="font-mono">{student.scores.S}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thinking (T)</span>
                      <span className="font-mono">{student.scores.T}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Judging (J)</span>
                      <span className="font-mono">{student.scores.J}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Introversion (I)</span>
                      <span className="font-mono">{student.scores.I}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intuition (N)</span>
                      <span className="font-mono">{student.scores.N}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feeling (F)</span>
                      <span className="font-mono">{student.scores.F}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Perceiving (P)</span>
                      <span className="font-mono">{student.scores.P}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Style */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Learning Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <Badge variant="secondary" className="text-xl px-4 py-2">
                  {student.learningStyle === 'readingWriting'
                    ? 'Reading/Writing'
                    : student.learningStyle.charAt(0).toUpperCase() +
                      student.learningStyle.slice(1)}
                </Badge>
              </div>

              {student.learningScores && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Visual</span>
                      <span>{student.learningScores.visual}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${student.learningScores.visual}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Auditory</span>
                      <span>{student.learningScores.auditory}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary transition-all"
                        style={{ width: `${student.learningScores.auditory}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Kinesthetic</span>
                      <span>{student.learningScores.kinesthetic}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${student.learningScores.kinesthetic}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Reading/Writing</span>
                      <span>{student.learningScores.readingWriting}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${student.learningScores.readingWriting}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Genius Type */}
          {student.geniusType && (
            <Card>
              <CardHeader>
                <CardTitle>Your Genius Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Badge variant="outline" className="text-xl px-4 py-2">
                    {student.geniusType}
                  </Badge>
                  <p className="mt-4 text-muted-foreground">
                    Your unique way of thinking and problem-solving
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
