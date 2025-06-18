import React, { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Maximize, 
  Minimize, 
  EyeOff, 
  Eye, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  Users
} from 'lucide-react';

function getAnimalEmoji(animalType: string): string {
  const emojis: Record<string, string> = {
    'Owl': '🦉', 'Cat': '🐱', 'Fox': '🦊', 'Elephant': '🐘', 'Dolphin': '🐬',
    'Deer': '🦌', 'Horse': '🐴', 'Koala': '🐨', 'Rabbit': '🐰', 'Tiger': '🐅',
    'Lion': '🦁', 'Otter': '🦦', 'Penguin': '🐧', 'Beaver': '🦫', 'Wolf': '🐺', 
    'Parrot': '🦜', 'Meerkat': '🐭', 'Panda': '🐼', 'Bear': '🐻', 'Eagle': '🦅',
    'Butterfly': '🦋'
  };
  return emojis[animalType] || '🐾';
}

interface LiveSubmission {
  studentName: string;
  animalType: string;
  timestamp: string;
}

interface RegionData {
  name: string;
  animals: string[];
  color: string;
  position: { x: number; y: number };
}

const ANIMAL_REGIONS: RegionData[] = [
  {
    name: "Meerkat",
    animals: ["Meerkat"],
    color: "#4B4959",
    position: { x: 15, y: 20 }
  },
  {
    name: "Panda", 
    animals: ["Panda"],
    color: "#82BCC8",
    position: { x: 85, y: 20 }
  },
  {
    name: "Owl",
    animals: ["Owl"],
    color: "#BAC97D",
    position: { x: 15, y: 50 }
  },
  {
    name: "Fox",
    animals: ["Fox"],
    color: "#E8A87C",
    position: { x: 85, y: 50 }
  },
  {
    name: "Elephant",
    animals: ["Elephant"],
    color: "#D4A5A5",
    position: { x: 15, y: 80 }
  },
  {
    name: "Dolphin",
    animals: ["Dolphin"],
    color: "#9BB7D4",
    position: { x: 85, y: 80 }
  }
];

function LiveDiscoveryBoard() {
  const [, params] = useRoute("/classes/:id/live");
  const classId = params?.id;
  const [, setLocation] = useLocation();
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Fetch class data
  const { data: classData } = useQuery({
    queryKey: ['class-analytics', classId],
    queryFn: async () => {
      const response = await fetch(`/api/classes/${classId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch class data');
      return response.json();
    },
    enabled: !!classId
  });

  // Real-time data fetching
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['live-submissions', classId, sessionStartTime],
    queryFn: async () => {
      const response = await fetch(`/api/classes/${classId}/live-submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    },
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    enabled: !!classId
  });

  // Filter submissions by session start time if set
  const filteredSubmissions = sessionStartTime 
    ? submissions.filter((sub: LiveSubmission) => new Date(sub.timestamp) >= sessionStartTime)
    : submissions;

  // Group submissions by region
  const regionSubmissions = ANIMAL_REGIONS.map(region => ({
    ...region,
    students: filteredSubmissions.filter((sub: LiveSubmission) => 
      region.animals.includes(sub.animalType)
    )
  }));

  const totalStudents = filteredSubmissions.length;

  const handleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };

  const handleStartFresh = () => {
    setSessionStartTime(new Date());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Live Discovery Board...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Class Info Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/95 rounded-lg p-4 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900">Live Discovery Board</h1>
          <p className="text-lg text-gray-700">{classData?.class?.name || 'Loading...'}</p>
          <p className="text-sm text-gray-600">Class Code: {classData?.class?.code || 'Loading...'}</p>
          <p className="text-sm text-gray-600 mt-2">{totalStudents} students discovered</p>
        </div>
      </div>

      {/* Personality Island Map */}
      <div className="absolute inset-0 p-4">
        <div className="relative w-full h-full">
          {/* Background island map */}
          <img 
            src="/images/personality island.jpg"
            alt="Personality Island Map"
            className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-900/20 rounded-2xl" />
          
          {/* Personality Regions */}
          {regionSubmissions.map((region) => (
            <div
              key={region.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${region.position.x}%`,
                top: `${region.position.y}%`
              }}
            >
              <Card className="min-w-48 shadow-lg border-2" style={{ borderColor: region.color }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg" style={{ color: region.color }}>
                      {region.name}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      className="text-white font-bold"
                      style={{ backgroundColor: region.color }}
                    >
                      {region.students.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {region.students.map((student: LiveSubmission, idx: number) => (
                      <div
                        key={`${student.studentName}-${student.timestamp}`}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded animate-in slide-in-from-bottom duration-500"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="text-lg">
                          {getAnimalEmoji(student.animalType)}
                        </div>
                        <span className="text-sm font-medium">
                          {showNames ? student.studentName : '•••'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {region.students.length === 0 && (
                    <div className="text-center text-gray-400 py-4">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Waiting for discoveries...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-black/80 backdrop-blur rounded-lg p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Button>
          
          <div className="w-px h-6 bg-white/30" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullScreen}
            className="text-white"
          >
            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNames(!showNames)}
            className="text-white"
          >
            {showNames ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          
          <div className="w-px h-6 bg-white/30" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartFresh}
            className="text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Start New Session
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LiveDiscoveryBoard;