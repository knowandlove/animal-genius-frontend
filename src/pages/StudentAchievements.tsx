import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { apiRequest } from '@/lib/queryClient';
import { getStoredPassportCode } from '@/lib/passport-auth';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt?: string | null;
  category?: string;
  points?: number;
}

interface AchievementsData {
  achievements: Achievement[];
  totalPoints: number;
  earnedPoints: number;
}

export default function StudentAchievements() {
  const [location, setLocation] = useLocation();
  const passportCode = getStoredPassportCode();

  // Fetch achievements data
  const { data, isLoading, error } = useQuery<AchievementsData>({
    queryKey: ['/api/student-passport/achievements', passportCode],
    queryFn: async () => {
      // For now, use the dashboard endpoint and extract achievements
      const dashboardData = await apiRequest('GET', '/api/student-passport/dashboard', undefined, {
        headers: {
          'X-Passport-Code': passportCode || '',
        },
      });
      
      // Transform the data into achievements format
      const achievements = dashboardData.achievements || [];
      const totalPoints = achievements.length * 10; // 10 points per achievement
      const earnedPoints = achievements.filter((a: Achievement) => a.earned).length * 10;
      
      return {
        achievements,
        totalPoints,
        earnedPoints,
      };
    },
    enabled: !!passportCode,
  });

  const handleBack = () => {
    setLocation('/student/dashboard');
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
            <CardTitle>Achievements Not Found</CardTitle>
            <CardDescription>
              We couldn't load your achievements. Please try again later.
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

  const earnedCount = data.achievements.filter(a => a.earned).length;
  const totalCount = data.achievements.length;
  const progressPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint/20 to-soft-lime/20">
      {/* Header */}
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
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold">{data.earnedPoints} Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Your Achievement Progress</CardTitle>
              <CardDescription>
                You've earned {earnedCount} out of {totalCount} achievements!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{earnedCount} Earned</span>
                  <span>{totalCount - earnedCount} Remaining</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <div className="text-center text-lg font-semibold mt-4">
                  {Math.round(progressPercentage)}% Complete
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`h-full transition-all ${
                  achievement.earned
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50'
                    : 'opacity-75 grayscale'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={`text-4xl mb-2 ${
                        achievement.earned ? '' : 'opacity-50'
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    {!achievement.earned && (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{achievement.name}</CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {achievement.earned ? (
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">
                        Earned!
                      </Badge>
                      {achievement.earnedAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Locked
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Motivational Message */}
        {earnedCount < totalCount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-none">
              <CardHeader>
                <CardTitle className="text-lg">Keep Going!</CardTitle>
                <CardDescription>
                  You're doing great! Keep exploring and learning to unlock more achievements.
                  Each achievement shows how amazing and unique you are!
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
