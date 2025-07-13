import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { apiRequest } from '@/lib/queryClient';
import { getStoredStudentData, getStoredPassportCode, clearPassportCode } from '@/lib/passport-auth';
import { Trophy, Home, ChartBar, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

// Map animal types to their emoji representations
const animalEmojis: Record<string, string> = {
  'Meerkat': '🦫',
  'Panda': '🐼',
  'Owl': '🦉',
  'Beaver': '🦝',
  'Elephant': '🐘',
  'Otter': '🦦',
  'Parrot': '🦜',
  'Border Collie': '🐕',
};

// Default achievement icons for fallback display
const defaultAchievements = [
  { id: 'quiz_complete', name: 'Quiz Champion', icon: '🌟' },
  { id: 'first_login', name: 'First Login', icon: '🎯' },
  { id: 'room_decorator', name: 'Room Decorator', icon: '💎' },
  { id: 'social_butterfly', name: 'Social Butterfly', icon: '🏅' },
  { id: 'knowledge_seeker', name: 'Knowledge Seeker', icon: '🎪' },
  { id: 'leader', name: 'Leader', icon: '🚀' },
];

interface DashboardData {
  student: {
    id: string;
    name: string;
    animalType: string;
    geniusType: string;
    passportCode: string;
    classId: string;
    className?: string;
    gradeLevel?: string;
    coins?: number;
    quizResults?: {
      personalityType: string;
      learningStyle: string;
      scores: any;
    };
  };
  achievements: Array<{
    id: string;
    name: string;
    icon: string;
    description?: string;
    earned: boolean;
    earnedAt?: string | null;
  }>;
}

export default function StudentDashboard() {
  const [location, setLocation] = useLocation();
  const passportCode = getStoredPassportCode();
  const studentData = getStoredStudentData();

  // Redirect to login if no passport code
  useEffect(() => {
    if (!passportCode) {
      setLocation('/student-login');
    }
  }, [passportCode, setLocation]);

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/student-passport/dashboard', passportCode],
    queryFn: async () => {
      return apiRequest('GET', '/api/student-passport/dashboard', undefined, {
        headers: {
          'X-Passport-Code': passportCode || '',
        },
      });
    },
    enabled: !!passportCode,
  });

  const handleLogout = () => {
    clearPassportCode();
    setLocation('/');
  };

  const handleNavigateToRoom = () => {
    if (passportCode) {
      setLocation(`/room/${passportCode}`);
    }
  };

  const handleNavigateToQuizResults = () => {
    setLocation('/student/quiz-results');
  };

  const handleNavigateToAchievements = () => {
    setLocation('/student/achievements');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint/20 to-soft-lime/20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || (!data && !studentData)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint/20 to-soft-lime/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Session Expired</CardTitle>
            <CardDescription>
              Your session has expired. Please log in again with your passport code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student } = data || { student: studentData };
  const animalEmoji = animalEmojis[student?.animalType || ''] || '🐾';

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint/20 to-soft-lime/20">
      {/* Header with logout */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {(student as any)?.className || 'Animal Genius'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Avatar */}
          <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-6xl">{animalEmoji}</span>
          </div>

          {/* Welcome Message */}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {student?.name?.split(' ')[0] || 'Student'}!
          </h1>
          
          {/* Animal Type and Passport Code */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span>{student?.animalType || 'Animal'}</span>
            <Badge variant="secondary" className="font-mono">
              {student?.passportCode || passportCode}
            </Badge>
            {(student as any)?.coins !== undefined && (
              <Badge variant="outline" className="gap-1">
                🪙 {(student as any).coins}
              </Badge>
            )}
          </div>

          {/* Achievement Badges */}
          <div className="flex gap-3 justify-center flex-wrap mt-6">
            {(data?.achievements || defaultAchievements).map((achievement) => (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.1 }}
                className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl transition-all ${
                  (achievement as any).earned
                    ? 'bg-gradient-to-br from-yellow-300 to-orange-400 shadow-md'
                    : 'bg-gray-200 opacity-50'
                }`}
                title={(achievement as any).description || achievement.name}
              >
                {achievement.icon}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Quiz Results Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-t-4 border-t-primary"
              onClick={handleNavigateToQuizResults}
            >
              <CardHeader>
                <div className="text-4xl mb-2">
                  <ChartBar className="w-12 h-12 text-primary" />
                </div>
                <CardTitle>My Quiz Results</CardTitle>
                <CardDescription>
                  View your personality type, learning style, and discover what makes you unique!
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          {/* My Room Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-t-4 border-t-secondary"
              onClick={handleNavigateToRoom}
            >
              <CardHeader>
                <div className="text-4xl mb-2">
                  <Home className="w-12 h-12 text-secondary" />
                </div>
                <CardTitle>My Room</CardTitle>
                <CardDescription>
                  Visit your personalized space where you can explore and express yourself!
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Achievements Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-t-4 border-t-accent"
              onClick={handleNavigateToAchievements}
            >
              <CardHeader>
                <div className="text-4xl mb-2">
                  <Trophy className="w-12 h-12 text-accent" />
                </div>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  Track all your badges and see what you can unlock next!
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity or Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-none">
            <CardHeader>
              <CardTitle className="text-lg">Did you know?</CardTitle>
              <CardDescription>
                As a {student?.animalType || 'student'}, you're naturally {
                  student?.animalType === 'Otter' ? 'playful and social' :
                  student?.animalType === 'Owl' ? 'thoughtful and analytical' :
                  student?.animalType === 'Panda' ? 'wise and balanced' :
                  student?.animalType === 'Meerkat' ? 'creative and caring' :
                  student?.animalType === 'Elephant' ? 'supportive and loyal' :
                  student?.animalType === 'Beaver' ? 'hardworking and organized' :
                  student?.animalType === 'Parrot' ? 'communicative and energetic' :
                  student?.animalType === 'Border Collie' ? 'focused and determined' :
                  'unique and special'
                }! Visit your room to learn more about your personality.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
