import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Medal } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  score: number;
  personalityType: string;
  isCurrentStudent: boolean;
  date: string;
}

interface PersonalBest {
  score: number;
  created_at: string;
}

interface HighScoreBoardProps {
  gameType: string;
  passportCode?: string;
  currentScore?: number;
  compact?: boolean;
}

export default function HighScoreBoard({ 
  gameType, 
  passportCode, 
  currentScore,
  compact = false 
}: HighScoreBoardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [personalBest, setPersonalBest] = useState<PersonalBest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [gameType, passportCode]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = passportCode ? `?passportCode=${passportCode}` : '';
      const response = await apiRequest(
        'GET', 
        `/api/game-scores/leaderboard/${gameType}${params}`
      );
      
      setLeaderboard(response.leaderboard || []);
      setPersonalBest(response.personalBest);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load high scores');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-sm text-gray-600 w-5 text-center">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (compact) {
    // Compact view for displaying during gameplay
    return (
      <div className="bg-white rounded-lg p-3 shadow-md">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
          <Trophy className="w-4 h-4" />
          Top Scores
        </h4>
        <div className="space-y-1 text-xs">
          {leaderboard.slice(0, 3).map((entry) => (
            <div 
              key={entry.studentId}
              className={`flex items-center justify-between gap-2 ${
                entry.isCurrentStudent ? 'font-semibold text-blue-600' : ''
              }`}
            >
              <div className="flex items-center gap-1">
                {getRankIcon(entry.rank)}
                <span className="truncate max-w-[100px]">{entry.studentName}</span>
              </div>
              <span>{entry.score}</span>
            </div>
          ))}
        </div>
        {personalBest && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Your Best:</span>
              <span className="font-semibold">{personalBest.score}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view for game over screen
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
      <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-500" />
        Class Leaderboard
      </h3>
      
      {currentScore && personalBest && currentScore > personalBest.score && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">
          <p className="font-semibold">New Personal Best! 🎉</p>
        </div>
      )}
      
      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div 
            key={entry.studentId}
            className={`flex items-center justify-between p-2 rounded-lg ${
              entry.isCurrentStudent 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {getRankIcon(entry.rank)}
              <div>
                <p className={`font-medium ${
                  entry.isCurrentStudent ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {entry.studentName}
                </p>
                <p className="text-xs text-gray-600">
                  {entry.personalityType}
                </p>
              </div>
            </div>
            <span className={`text-lg font-bold ${
              entry.isCurrentStudent ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {entry.score}
            </span>
          </div>
        ))}
      </div>
      
      {leaderboard.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          No scores yet. Be the first!
        </p>
      )}
    </div>
  );
}