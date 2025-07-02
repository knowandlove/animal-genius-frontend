import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { apiRequest } from "@/lib/queryClient";
import { Home, Lock, Mail, Users, Search, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import PassportCodeDialog from "@/components/room/PassportCodeDialog";
import { authenticateStudent } from "@/lib/student-auth";
// Removed LayeredAvatar import - using head icons instead

// Helper function to get animal head icon URL
const getAnimalHeadIcon = (animalType: string): string => {
  // Normalize the animal type for the URL
  const normalizedType = animalType.toLowerCase().replace(/\s+/g, '_');
  return `https://zqyvfnbwpagguutzdvpy.supabase.co/storage/v1/object/public/public-assets/animals/head_icons/${normalizedType}.png`;
};

interface ClassIslandStudent {
  id: string;
  passportCode: string;
  studentName: string;
  animalType: string;
  animalTypeId: string;
  geniusType: string;
  avatarData: any;
  roomVisibility: string;
}

interface ClassIslandData {
  classId: string;
  className: string;
  classCode?: string;
  students: ClassIslandStudent[];
  currentStudent?: string;
  stats: {
    totalStudents: number;
    visibleRooms: number;
  };
  isPublicView?: boolean;
}

export default function ClassIsland() {
  const [location, setLocation] = useLocation();
  const { classId, classCode } = useParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingRoom, setPendingRoom] = useState<string | null>(null);
  const [authenticatedStudent, setAuthenticatedStudent] = useState<string | null>(null);

  // Determine view type
  const isTeacherView = location.includes('/teacher/') && classId;
  const isPublicView = location.includes('/class/') && classCode;
  const isStudentView = !isTeacherView && !isPublicView;
  
  // Use different endpoints based on view type
  let endpoint = '/api/room/my-class-island'; // default student view
  if (isTeacherView) {
    endpoint = `/api/classes/${classId}/island`;
  } else if (isPublicView) {
    endpoint = `/api/class/${classCode}/island`;
  }

  // Fetch class island data - use appropriate endpoint
  const { data, isLoading, error } = useQuery<ClassIslandData>({
    queryKey: [endpoint],
    queryFn: () => apiRequest('GET', endpoint),
    retry: (failureCount, error: any) => {
      // Only retry if it's not an auth error
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Filter students based on search
  const filteredStudents = data?.students.filter(student => 
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.animalType.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle authentication
  const handleAuthenticate = async (code: string) => {
    try {
      setAuthError(null);
      await authenticateStudent(code, classCode);
      setAuthenticatedStudent(code);
      setShowAuthDialog(false);
      
      // If there was a pending room navigation, go there now
      if (pendingRoom) {
        setLocation(`/room/${pendingRoom}`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid passport code');
    }
  };

  // Handle room navigation
  const handleVisitRoom = (student: ClassIslandStudent) => {
    if (isPublicView && !authenticatedStudent) {
      // In public view, require authentication first
      setPendingRoom(student.passportCode);
      setShowAuthDialog(true);
    } else {
      // Navigate to the room
      setLocation(`/room/${student.passportCode}`);
    }
  };

  // Check if we need authentication (401 error) - only for student views
  useEffect(() => {
    if (isStudentView && error && (error as any).status === 401) {
      setShowAuthDialog(true);
    }
  }, [error, isStudentView]);

  // If we have a 401 error and dialog is not showing, show the auth prompt (students only)
  if (isStudentView && error && (error as any).status === 401 && !showAuthDialog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="p-8 max-w-md text-center">
          <div className="mb-6">
            <Users className="w-16 h-16 text-gray-400 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Class Island!</h2>
          <p className="text-muted-foreground mb-6">
            Enter your passport code to see your classmates and visit their rooms.
          </p>
          <Button onClick={() => setShowAuthDialog(true)} className="w-full">
            Enter Passport Code
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="p-8">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Loading your class island...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">🏝️</div>
            <h2 className="text-xl font-bold mb-2">Class Not Found</h2>
            <p className="text-muted-foreground">
              Unable to load your class island. Please try again or contact your teacher.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PassportCodeDialog
        open={showAuthDialog}
        onSuccess={() => setShowAuthDialog(false)}
        onClose={() => {
          setShowAuthDialog(false);
          setPendingRoom(null);
          setAuthError(null);
        }}
        passportCode=""
        error={authError}
        onSubmit={handleAuthenticate}
        title={pendingRoom ? "Enter Your Passport Code" : "Welcome to Class Island!"}
        description={pendingRoom 
          ? "Enter your passport code to visit this room" 
          : "Enter your passport code to see your classmates and explore their rooms"
        }
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {data.className} Island
                </h1>
                <p className="text-sm text-muted-foreground">
                  {data.stats.totalStudents} students • {data.stats.visibleRooms} rooms to visit
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={cn(viewMode === 'grid' && 'bg-gray-100')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={cn(viewMode === 'list' && 'bg-gray-100')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search classmates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Students Grid/List */}
        <div className="container mx-auto px-4 pb-8">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {filteredStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    <Card 
                      className={cn(
                        "p-4 cursor-pointer transition-shadow hover:shadow-lg",
                        (student.passportCode === data.currentStudent || student.passportCode === authenticatedStudent) && "ring-2 ring-purple-400"
                      )}
                      onClick={() => handleVisitRoom(student)}
                    >
                      {/* Avatar */}
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 mb-3 flex items-center justify-center overflow-hidden p-2">
                        <img
                          src={getAnimalHeadIcon(student.animalType)}
                          alt={student.animalType}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to a default image if the head icon doesn't load
                            (e.target as HTMLImageElement).src = '/images/question_icon.png';
                          }}
                        />
                      </div>
                      
                      {/* Student Info */}
                      <h3 className="font-semibold text-sm truncate">{student.studentName}</h3>
                      <p className="text-xs text-muted-foreground truncate">{student.animalType}</p>
                      
                      {/* Room Status */}
                      <div className="absolute top-2 right-2">
                        {student.roomVisibility === 'private' ? (
                          <div className="bg-gray-100 rounded-full p-1.5" title="Private Room">
                            <Lock className="w-3 h-3 text-gray-600" />
                          </div>
                        ) : student.roomVisibility === 'invite_only' ? (
                          <div className="bg-yellow-100 rounded-full p-1.5" title="Invite Only">
                            <Mail className="w-3 h-3 text-yellow-600" />
                          </div>
                        ) : (
                          <div className="bg-green-100 rounded-full p-1.5" title="Open to Class">
                            <Home className="w-3 h-3 text-green-600" />
                          </div>
                        )}
                      </div>

                      {/* Current Student Badge */}
                      {(student.passportCode === data.currentStudent || student.passportCode === authenticatedStudent) && (
                        <Badge className="absolute top-2 left-2 text-xs" variant="default">
                          You
                        </Badge>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-2">
              <AnimatePresence>
                {filteredStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card 
                      className={cn(
                        "p-4 cursor-pointer transition-shadow hover:shadow-md",
                        (student.passportCode === data.currentStudent || student.passportCode === authenticatedStudent) && "ring-2 ring-purple-400"
                      )}
                      onClick={() => handleVisitRoom(student)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                          <img
                            src={getAnimalHeadIcon(student.animalType)}
                            alt={student.animalType}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback to a default image if the head icon doesn't load
                              (e.target as HTMLImageElement).src = '/images/question_icon.png';
                            }}
                          />
                        </div>
                        
                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{student.studentName}</h3>
                            {(student.passportCode === data.currentStudent || student.passportCode === authenticatedStudent) && (
                              <Badge className="text-xs" variant="default">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{student.animalType} • {student.geniusType}</p>
                        </div>
                        
                        {/* Room Status */}
                        <div className="flex items-center gap-2">
                          {student.roomVisibility === 'private' ? (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="w-3 h-3" />
                              Private
                            </Badge>
                          ) : student.roomVisibility === 'invite_only' ? (
                            <Badge variant="secondary" className="gap-1">
                              <Mail className="w-3 h-3" />
                              Invite Only
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Home className="w-3 h-3" />
                              Open
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No students found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}