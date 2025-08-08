import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/loading-spinner';
import { apiRequest } from '@/lib/queryClient';
import { getStoredStudentData, getStoredPassportCode, clearPassportCode, getPassportAuthHeaders } from '@/lib/passport-auth';
import { Trophy, Home, ChartBar, LogOut, Trees, Sparkles, Wand2, Coins, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentHeader } from '@/components/StudentHeader';
import FirstTimeAvatarCustomization from '@/components/avatar/FirstTimeAvatarCustomization';
import { ServerAvatar } from '@/components/avatar/ServerAvatar';
import FullScreenAvatarCustomizer from '@/components/room/FullScreenAvatarCustomizer';
import StoreModal from '@/components/room/StoreModal';
import { cn } from '@/lib/utils';
import { StoreDataProvider } from '@/contexts/StoreDataContext';
import { getAssetUrl } from '@/utils/cloud-assets';
import { getDefaultColors } from '@/config/animal-color-palettes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardSkeleton } from '@/components/skeletons/AvatarSkeleton';

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
  { id: 'quiz_complete', name: 'Animal Genius', icon: '🌟' },
  { id: 'first_login', name: 'First Login', icon: '🎯' },
  { id: 'placeholder_1', name: '', icon: '🔒' },
  { id: 'placeholder_2', name: '', icon: '🔒' },
  { id: 'placeholder_3', name: '', icon: '🔒' },
  { id: 'placeholder_4', name: '', icon: '🔒' },
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
    avatarData?: {
      colors?: {
        primaryColor?: string;
        secondaryColor?: string;
        hasCustomized?: boolean;
      };
      equipped?: {
        hat?: string;
        glasses?: string;
        accessory?: string;
      };
    };
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
  const queryClient = useQueryClient();
  const passportCode = getStoredPassportCode();
  const studentData = getStoredStudentData();
  const [showColorCustomization, setShowColorCustomization] = useState(false);
  const [showFullCustomization, setShowFullCustomization] = useState(false);
  const [isStoreDataReady, setIsStoreDataReady] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [selectedStoreItem, setSelectedStoreItem] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  // Check for first-time avatar customization flag
  useEffect(() => {
    const shouldShowAvatar = localStorage.getItem('showAvatarCustomization');
    if (shouldShowAvatar === 'true') {
      setShowColorCustomization(true);
      localStorage.removeItem('showAvatarCustomization');
    }
  }, []);

  // Redirect to login if no passport code
  useEffect(() => {
    if (!passportCode) {
      setLocation('/student-login');
    }
  }, [passportCode, setLocation]);

  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['/api/student-passport/dashboard', passportCode],
    queryFn: async () => {
      const dashboardData = await apiRequest('GET', '/api/student-passport/dashboard', undefined, {
        headers: {
          'X-Passport-Code': passportCode || '',
        },
      });
      
      // Transform achievements data to match the new format
      if (dashboardData.achievements) {
        // Keep only first 2 achievements and modify Quiz Champion
        const visibleAchievements = dashboardData.achievements.slice(0, 2).map((achievement: any) => {
          if (achievement.name === 'Quiz Champion') {
            return {
              ...achievement,
              name: 'Animal Genius',
              description: 'You discovered your Animal Genius!'
            };
          }
          return achievement;
        });
        
        // Add 4 placeholder achievements
        for (let i = 0; i < 4; i++) {
          visibleAchievements.push({
            id: `placeholder-${i}`,
            name: '',
            icon: '🔒',
            description: '',
            earned: false,
            category: 'placeholder'
          });
        }
        
        dashboardData.achievements = visibleAchievements;
      }
      
      return dashboardData;
    },
    enabled: !!passportCode
  });
  
  // Fetch room data which includes inventory
  const { data: roomData, refetch: refetchRoomData } = useQuery({
    queryKey: [`/api/room-page-data/${passportCode}`],
    queryFn: async () => {
      return apiRequest('GET', `/api/room-page-data/${passportCode}`, undefined, {
        headers: getPassportAuthHeaders()
      });
    },
    enabled: !!passportCode
  });
  

  // Single mutation for saving avatar data (handles both colors and equipped items)
  const saveAvatarDataMutation = useMutation({
    mutationFn: async (data: { equipped?: any; colors?: any }) => {
      // If colors are provided, add metadata
      const colors = data.colors ? {
        ...data.colors,
        hasCustomized: true,
        customizedAt: new Date().toISOString()
      } : (roomData?.room?.avatarData?.colors || {});
      
      return apiRequest('POST', `/api/room/${passportCode}/avatar`, {
        colors,
        equipped: data.equipped || {}
      }, {
        headers: getPassportAuthHeaders()
      });
    },
    onSuccess: () => {
      refetch();
      refetchRoomData();
    }
  });

  // Simplified purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest('POST', `/api/store-direct/purchase`, {
        itemId
      }, {
        headers: getPassportAuthHeaders()
      });
    },
    onSuccess: () => {
      // Simple invalidation - let React Query handle the rest
      queryClient.invalidateQueries({ queryKey: [`/api/room-page-data/${passportCode}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-passport/dashboard'] });
      setShowPurchaseDialog(false);
    },
    onError: (error) => {
      console.error('Purchase failed:', error);
      // Could add toast notification here
    }
  });

  const handleLogout = () => {
    clearPassportCode();
    setLocation('/');
  };


  const getAnimalResultUrl = (animalType: string) => {
    // Convert animal type to URL format
    const animalUrlMap: Record<string, string> = {
      'Meerkat': 'meerkat-result',
      'Panda': 'panda-result',
      'Owl': 'owl-result',
      'Beaver': 'beaver-result',
      'Elephant': 'elephant-result',
      'Otter': 'otter-result',
      'Parrot': 'parrot-result',
      'Border Collie': 'border-collie-result'
    };
    
    return `https://knowandlove.com/${animalUrlMap[animalType] || 'panda-result'}`;
  };

  const handleNavigateToQuizResults = () => {
    const animalType = data?.student?.animalType;
    if (animalType) {
      const resultUrl = getAnimalResultUrl(animalType);
      window.open(resultUrl, '_blank');
    } else {
      // Fallback to internal page if no animal type found
      setLocation('/student/quiz-results');
    }
  };

  const handleNavigateToAchievements = () => {
    setLocation('/student/achievements');
  };

  const handlePurchaseClick = (item: any) => {
    setSelectedStoreItem(item);
    setShowPurchaseDialog(true);
  };

  const confirmPurchase = () => {
    if (selectedStoreItem) {
      purchaseMutation.mutate(selectedStoreItem.id);
    }
  };

  // Wait for StoreDataProvider to be ready - MUST be before any conditional returns
  useEffect(() => {
    // Give StoreDataProvider time to initialize
    const timer = setTimeout(() => {
      setIsStoreDataReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show skeleton while loading initial data
  if (isLoading || !data) {
    return <DashboardSkeleton />;
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

  // Only create merged student data when BOTH queries have completed
  // This prevents the avatar from rendering with incomplete/default data
  const student = data?.student;
  
  // Wait for both dashboard and room data before creating the final student object
  const studentWithAvatar = (student && roomData) ? {
    ...student,
    avatarData: roomData.room?.avatarData || student.avatarData,
    coins: roomData.room?.currencyBalance ?? student.coins
  } : undefined;
  
  const animalEmoji = animalEmojis[studentWithAvatar?.animalType || ''] || '🐾';

  return (
    <StoreDataProvider>
      <>
      {/* First-time color customization */}
      {showColorCustomization && studentWithAvatar && (
        <ErrorBoundary 
          componentName="First Time Avatar Customization"
          isolate
          resetKeys={[studentWithAvatar.animalType]}
        >
          <FirstTimeAvatarCustomization
            animalType={studentWithAvatar.animalType}
            studentName={studentWithAvatar.name}
            onComplete={(colors) => {
              saveAvatarDataMutation.mutate({ colors });
              setShowColorCustomization(false);
            }}
          />
        </ErrorBoundary>
      )}

      {/* Full avatar customization modal */}
      <AnimatePresence>
        {showFullCustomization && isStoreDataReady && (
          <ErrorBoundary 
            componentName="Avatar Customizer"
            isolate
            resetKeys={studentWithAvatar?.animalType ? [studentWithAvatar.animalType] : []}
          >
            <FullScreenAvatarCustomizer
              student={studentWithAvatar}
              onClose={() => setShowFullCustomization(false)}
              onSave={(data) => {
                // Save both equipped items and colors together
                saveAvatarDataMutation.mutate(data);
              }}
              onColorChange={(colors) => {
                // This is for real-time color preview updates
                // The actual save happens when clicking "Save & Close"
              }}
              inventoryData={roomData?.room || roomData}
            />
          </ErrorBoundary>
        )}
      </AnimatePresence>

      {/* Store Modal */}
      <ErrorBoundary 
        componentName="Store Modal"
        isolate
        resetKeys={[showStore ? 'store-open' : 'store-closed']}
      >
        <StoreModal
          open={showStore}
          onOpenChange={setShowStore}
          storeStatus={{
            isOpen: true,
            message: "Welcome to the Island Store!"
          }}
          storeCatalog={roomData?.storeCatalog || []}
          availableBalance={studentWithAvatar?.coins || 0}
          onPurchaseClick={handlePurchaseClick}
        />
      </ErrorBoundary>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Your coins will be deducted immediately and the item will be added to your inventory.
            </DialogDescription>
          </DialogHeader>
          {selectedStoreItem && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{selectedStoreItem.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedStoreItem.description}</p>
                </div>
                <Badge variant={selectedStoreItem.rarity === 'rare' ? 'default' : 'outline'}>
                  {selectedStoreItem.rarity || 'common'}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-lg">{selectedStoreItem.cost} coins</span>
                </div>
                <div className="text-sm">
                  <div>Current balance: <span className="font-semibold">{studentWithAvatar?.coins || 0}</span> coins</div>
                  <div className={cn(
                    "mt-1",
                    (studentWithAvatar?.coins || 0) - selectedStoreItem.cost < 0 ? "text-red-600" : "text-green-600"
                  )}>
                    After purchase: <span className="font-semibold">{(studentWithAvatar?.coins || 0) - selectedStoreItem.cost}</span> coins
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmPurchase} 
              disabled={purchaseMutation.isPending || (selectedStoreItem ? (studentWithAvatar?.coins || 0) < selectedStoreItem.cost : false)}
              className={cn(
                selectedStoreItem && (studentWithAvatar?.coins || 0) >= selectedStoreItem.cost 
                  ? "bg-green-600 hover:bg-green-700" 
                  : ""
              )}
            >
              {purchaseMutation.isPending ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Buy Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {/* Student Header */}
        <StudentHeader />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid lg:grid-cols-[400px,1fr] gap-8">
            {/* Left Side - Avatar Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-start justify-center h-full py-4"
            >
              {/* Avatar Display */}
              <div className="relative flex flex-col items-start w-full">
                <div className="-ml-12">
                  {/* Show loading state until we have BOTH student AND room data */}
                  {(!studentWithAvatar?.animalType || !roomData) ? (
                    <div className="w-[350px] h-[450px] flex items-center justify-center bg-white/80 backdrop-blur rounded-2xl shadow-lg">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-600 font-medium">Loading your avatar...</p>
                      </div>
                    </div>
                  ) : (
                    <ServerAvatar
                      animalType={studentWithAvatar.animalType}
                      width={350}
                      height={450}
                      primaryColor={studentWithAvatar.avatarData?.colors?.primaryColor || getDefaultColors(studentWithAvatar.animalType).primaryColor}
                      secondaryColor={studentWithAvatar.avatarData?.colors?.secondaryColor || getDefaultColors(studentWithAvatar.animalType).secondaryColor}
                      equippedItems={Object.values(studentWithAvatar.avatarData?.equipped || {}).filter(Boolean) as string[]}
                      animated
                    />
                  )}
                </div>
                {/* Customize Button - only show when avatar is loaded */}
                {studentWithAvatar?.animalType && roomData && (
                  <Button
                    onClick={() => setShowFullCustomization(true)}
                    className="mt-10 gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8"
                    style={{ marginLeft: '100px' }}
                  >
                    <Wand2 className="w-4 h-4" />
                    Customize Avatar
                  </Button>
                )}
              </div>

            </motion.div>

            {/* Right Side - Welcome and Cards */}
            <div className="flex flex-col gap-6">
              {/* Welcome Section with Coins */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-start"
              >
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    Welcome back, {studentWithAvatar?.name?.split(' ')[0] || 'Student'}!
                  </h1>
                  <p className="text-gray-600">
                    Here's your learning dashboard. Click your avatar to customize your look!
                  </p>
                </div>
                {studentWithAvatar?.coins !== undefined && (
                  <div className="bg-yellow-400 rounded-full px-5 py-3 flex items-center gap-2 shadow-lg">
                    <div className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center text-yellow-700 font-bold text-lg border-2 border-yellow-500">
                      $
                    </div>
                    <span className="font-bold text-xl text-gray-800">{studentWithAvatar.coins} coins</span>
                  </div>
                )}
              </motion.div>

              {/* Action Cards - Now just Store and Quiz Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* My Quiz Results Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-xl transition-all bg-white/90 backdrop-blur border-0 h-full"
                    onClick={handleNavigateToQuizResults}
                  >
                    <CardHeader className="text-center p-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ChartBar className="w-12 h-12 text-white" />
                      </div>
                      <CardTitle className="text-lg font-semibold">My Quiz Results</CardTitle>
                      <CardDescription className="text-xs mt-2">
                        View your personality type and learning style!
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                {/* Island Store Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="relative bg-white/90 backdrop-blur border-0 h-full opacity-60">
                    <CardHeader className="text-center p-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-12 h-12 text-white opacity-50" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-500">Island Store</CardTitle>
                      <CardDescription className="text-xs mt-2 text-gray-400">
                        Shop for cool items!
                      </CardDescription>
                    </CardHeader>
                    {/* Coming Soon Overlay */}
                    <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-full text-sm shadow-xl animate-pulse">
                        ✨ COMING SOON ✨
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Coming Soon Section for Gardens */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4"
              >
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 border-dashed">
                  <CardHeader className="text-center py-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trees className="w-5 h-5 text-green-600" />
                      <CardTitle className="text-lg font-semibold text-green-800">Gardens Coming Soon!</CardTitle>
                      <Home className="w-5 h-5 text-green-600" />
                    </div>
                    <CardDescription className="text-green-700">
                      Your personal Grow Zone and Class Garden are being planted and will bloom in v2!
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              {/* My Achievements Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <Card 
                  className="cursor-pointer hover:shadow-xl transition-all bg-white/90 backdrop-blur border-0"
                  onClick={handleNavigateToAchievements}
                >
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl font-semibold mb-4">My Achievements</CardTitle>
                    <div className="flex gap-3 flex-wrap justify-center">
                      {(data?.achievements || defaultAchievements).map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          whileHover={{ scale: 1.1 }}
                          className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
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
                  </CardHeader>
                </Card>
              </motion.div>
              </div>
            </div>
          </div>
        </div>
      </>
    </StoreDataProvider>
  );
}
