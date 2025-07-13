import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtime } from '@/hooks/useRealtime';
import { 
  ArrowLeft, 
  Maximize, 
  Minimize, 
  EyeOff, 
  Eye, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';

function getAnimalImagePath(animalType: string): string {
  const animalMap: Record<string, string> = {
    'Meerkat': 'meerkat',
    'Panda': 'panda',
    'Owl': 'owl',
    'Beaver': 'beaver',
    'Elephant': 'elephant',
    'Otter': 'otter',
    'Parrot': 'parrot',
    'Border Collie': 'collie',
    'Collie': 'collie'
  };
  const filename = animalMap[animalType] || 'meerkat';
  return `/images/${filename}.png`;
}

interface LiveSubmission {
  id: string;
  studentName: string;
  animalType: string;
  timestamp: string;
}

interface RevealAnimation {
  id: string;
  studentName: string;
  animalType: string;
  x: number;
  y: number;
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
    position: { x: 15, y: 15 }
  },
  {
    name: "Panda", 
    animals: ["Panda"],
    color: "#85B2C8",
    position: { x: 85, y: 15 }
  },
  {
    name: "Owl",
    animals: ["Owl"],
    color: "#BAC97D",
    position: { x: 15, y: 40 }
  },
  {
    name: "Beaver",
    animals: ["Beaver"],
    color: "#829B79",
    position: { x: 85, y: 40 }
  },
  {
    name: "Elephant",
    animals: ["Elephant"],
    color: "#BD85C8",
    position: { x: 15, y: 65 }
  },
  {
    name: "Otter",
    animals: ["Otter"],
    color: "#FACC7D",
    position: { x: 85, y: 65 }
  },
  {
    name: "Parrot",
    animals: ["Parrot"],
    color: "#FF8070",
    position: { x: 15, y: 90 }
  },
  {
    name: "Border Collie",
    animals: ["Border Collie", "Collie"],
    color: "#DEA77E",
    position: { x: 85, y: 90 }
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
  const [liveSubmissions, setLiveSubmissions] = useState<LiveSubmission[]>([]);
  const [revealAnimations, setRevealAnimations] = useState<RevealAnimation[]>([]);

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

  // Initial data fetch for existing submissions
  const { data: initialSubmissions = [], isLoading } = useQuery({
    queryKey: ['live-submissions', classId],
    queryFn: async () => {
      const response = await fetch(`/api/classes/${classId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      
      // Transform analytics data to submission format
      return data.submissions
        ?.filter((submission: any) => submission.completedAt)
        .map((submission: any) => ({
          id: submission.id || `${submission.studentName}-${submission.completedAt}`,
          studentName: submission.studentName,
          animalType: submission.animalType,
          timestamp: submission.completedAt
        })) || [];
    },
    enabled: !!classId
  });

  // Real-time subscription for new quiz submissions - filtered by class
  const { isConnected: isRealtimeConnected, error: realtimeError } = useRealtime(
    {
      table: 'quiz_submissions',
      event: 'INSERT',
      filter: `class_id=eq.${classId}`,
      onError: (error) => {
        console.error('Realtime error:', error);
      }
    },
    async (event) => {
      console.log('Realtime event received:', event);
      if (event.eventType === 'INSERT' && event.new) {
        // Fetch additional data about this submission
        try {
          const response = await fetch(`/api/quiz-submissions/${event.new.id}/details`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          
          if (response.ok) {
            const submissionDetails = await response.json();
            console.log('Submission details:', submissionDetails);
            
            // No need to check class_id anymore - realtime filter handles it!
            const newSubmission: LiveSubmission = {
                id: event.new.id,
                studentName: submissionDetails.studentName,
                animalType: submissionDetails.animalType,
                timestamp: event.new.completed_at || new Date().toISOString()
              };
              
              setLiveSubmissions(prev => {
                // Prevent duplicates
                if (prev.some(s => s.id === newSubmission.id)) {
                  return prev;
                }
                return [...prev, newSubmission];
              });
              
              // Create reveal animation
              console.log('Creating reveal animation for:', newSubmission);
              const reveal: RevealAnimation = {
                id: newSubmission.id,
                studentName: newSubmission.studentName,
                animalType: newSubmission.animalType,
                x: 20 + Math.random() * 60, // Random position 20-80% of screen width
                y: 20 + Math.random() * 40  // Random position 20-60% of screen height
              };
              
              setRevealAnimations(prev => {
                console.log('Adding reveal animation');
                return [...prev, reveal];
              });
              
              // Remove animation after 3 seconds
              setTimeout(() => {
                setRevealAnimations(prev => prev.filter(r => r.id !== reveal.id));
              }, 3000);
              
              // Play sound notification if enabled
              if (soundEnabled) {
                // You can add a notification sound here
                console.log('New discovery:', newSubmission);
              }
          }
        } catch (error) {
          console.error('Failed to fetch submission details:', error);
        }
      }
    },
    [classId, soundEnabled]
  );

  // Initialize live submissions with existing data
  useEffect(() => {
    if (initialSubmissions.length > 0) {
      setLiveSubmissions(initialSubmissions);
    }
  }, [initialSubmissions]);

  // Filter submissions by session start time if set
  const filteredSubmissions = sessionStartTime 
    ? liveSubmissions.filter((sub: LiveSubmission) => new Date(sub.timestamp) >= sessionStartTime)
    : liveSubmissions;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Reveal Animations */}
      {revealAnimations.map((reveal) => {
        const region = ANIMAL_REGIONS.find(r => r.animals.includes(reveal.animalType));
        const color = region?.color || '#4B4959';
        
        return (
          <div
            key={reveal.id}
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${reveal.x}%`,
              top: `${reveal.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div 
              className="animate-in zoom-in-95 duration-500"
              style={{
                animation: 'revealAndShrink 3s ease-out forwards',
                transformOrigin: 'center center'
              }}
            >
              <div 
                className="bg-white rounded-3xl p-8 shadow-2xl border-4"
                style={{ borderColor: color }}
              >
                <style>{`
                  @keyframes revealAndShrink {
                    0% {
                      transform: scale(0) rotate(0deg);
                      opacity: 0;
                    }
                    20% {
                      transform: scale(1.2) rotate(5deg);
                      opacity: 1;
                    }
                    30% {
                      transform: scale(1) rotate(-2deg);
                    }
                    70% {
                      transform: scale(1) rotate(0deg);
                      opacity: 1;
                    }
                    100% {
                      transform: scale(0) translateY(100px);
                      opacity: 0;
                    }
                  }
                `}</style>
                <img 
                  src={getAnimalImagePath(reveal.animalType)}
                  alt={`${reveal.animalType} avatar`}
                  className="w-24 h-24 object-contain mb-4 mx-auto"
                />
                <div 
                  className="text-center font-bold text-lg"
                  style={{ color: color }}
                >
                  {reveal.studentName}
                </div>
                <div className="text-center text-sm text-gray-600 mt-1">
                  discovered their inner
                </div>
                <div 
                  className="text-center font-bold text-xl mt-1"
                  style={{ color: color }}
                >
                  {reveal.animalType}!
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Class Info Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/95 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Live Discovery Board</h1>
            <div className="flex items-center gap-2">
              {isRealtimeConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">LIVE</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">OFFLINE</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-700">{classData?.class?.name || 'Loading...'}</p>
          <p className="text-sm text-gray-600">Class Code: {classData?.class?.code || 'Loading...'}</p>
          <p className="text-sm text-gray-600 mt-2">{totalStudents} students discovered</p>
          {realtimeError && (
            <p className="text-xs text-red-600 mt-1">Realtime connection error</p>
          )}
        </div>
      </div>

      {/* Animal Columns */}
      <div className="flex-1 overflow-hidden p-8 pt-24">
        <div className="h-full max-w-7xl mx-auto">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 h-full">
            {regionSubmissions.map((region) => (
              <div
                key={region.name}
                className="flex flex-col h-full"
              >
                {/* Column Header */}
                <div className="text-center mb-4">
                  <img 
                    src={getAnimalImagePath(region.name)}
                    alt={`${region.name} avatar`}
                    className="w-16 h-16 object-contain mx-auto mb-2"
                  />
                  <h3 
                    className="font-bold text-sm"
                    style={{ color: region.color }}
                  >
                    {region.name}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className="text-white font-bold mt-1"
                    style={{ backgroundColor: region.color }}
                  >
                    {region.students.length}
                  </Badge>
                </div>
                
                {/* Student Stack */}
                <div className="flex-1 overflow-y-auto">
                  {region.students.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-300">
                        <Users className="w-8 h-8 mx-auto mb-1 opacity-30" />
                        <p className="text-xs">Waiting...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {region.students.map((student: LiveSubmission, idx: number) => (
                        <div
                          key={student.id}
                          className="animate-in slide-in-from-bottom duration-500"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div 
                            className="py-2 px-3 rounded-lg text-center text-white text-xs font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer mx-1"
                            style={{ backgroundColor: region.color }}
                            title={student.studentName}
                          >
                            {showNames ? student.studentName : '•••'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Test animation with a random existing student
              if (liveSubmissions.length > 0) {
                const randomStudent = liveSubmissions[Math.floor(Math.random() * liveSubmissions.length)];
                const reveal: RevealAnimation = {
                  id: `test-${Date.now()}`,
                  studentName: randomStudent.studentName,
                  animalType: randomStudent.animalType,
                  x: 20 + Math.random() * 60,
                  y: 20 + Math.random() * 40
                };
                setRevealAnimations(prev => [...prev, reveal]);
                setTimeout(() => {
                  setRevealAnimations(prev => prev.filter(r => r.id !== reveal.id));
                }, 3000);
              }
            }}
            className="text-white"
            title="Test the discovery animation"
          >
            ✨ Test Animation
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