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
import StudentPassportDialog from "@/components/StudentPassportDialog";
import { getAnimalByName } from "@/lib/animals";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { AvatarThumbnail } from "@/components/avatar/AvatarThumbnail";
import { preloadThumbnails } from "@/utils/avatar-thumbnail";

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
  const [showPassportDialog, setShowPassportDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ClassIslandStudent | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authTokenChanged"));
    setLocation("/");
  };

  // Determine view type based on URL and authentication
  const isTeacherView = (location.includes('/teacher/') || location.includes('/dashboard')) && classId;
  const isPublicView = location.includes('/class/') && classCode;
  const isStudentView = !isTeacherView && !isPublicView && location.includes('/student/');
  
  // Use different endpoints based on view type
  let endpoint = '';
  if (isTeacherView && classId) {
    endpoint = `/api/classes/${classId}/island`;
  } else if (isPublicView && classCode) {
    endpoint = `/api/class/${classCode}/island`;
  } else if (isStudentView) {
    endpoint = '/api/room/my-class-island';
  } else {
    // If we can't determine the view type, don't fetch
    console.warn('Cannot determine class island view type from URL:', location);
  }

  // Fetch class island data - use appropriate endpoint
  const { data, isLoading, error } = useQuery<ClassIslandData>({
    queryKey: [endpoint],
    queryFn: async () => {
      if (!endpoint) {
        throw new Error('No endpoint determined for class island view');
      }
      console.log('Fetching class island from endpoint:', endpoint);
      const response = await apiRequest('GET', endpoint);
      console.log('Class island response:', response);
      return response;
    },
    enabled: !!endpoint, // Only run query if we have an endpoint
    retry: (failureCount, error: any) => {
      // Only retry if it's not an auth error
      if (error?.status === 401 || error?.status === 400) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Filter students based on search
  const filteredStudents = data?.students?.filter(student => 
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.animalType.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Preload thumbnails when students data changes
  useEffect(() => {
    if (filteredStudents.length > 0) {
      preloadThumbnails(filteredStudents, { size: 96 });
    }
  }, [filteredStudents]);

  // Handle student avatar click
  const handleStudentClick = (student: ClassIslandStudent) => {
    setSelectedStudent(student);
    setShowPassportDialog(true);
  };







  if (isLoading) {
    const loadingContent = (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="p-8">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Loading your class island...</p>
          </div>
        </Card>
      </div>
    );

    if (isTeacherView) {
      return (
        <AuthenticatedLayout 
          showSidebar={true}
          classId={classId}
          className={undefined}
          user={undefined}
          onLogout={handleLogout}
        >
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
            <span className="ml-2">Loading class island...</span>
          </div>
        </AuthenticatedLayout>
      );
    }

    return loadingContent;
  }

  if (error || !data) {
    const errorContent = (
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

    if (isTeacherView) {
      return (
        <AuthenticatedLayout 
          showSidebar={true}
          classId={classId}
          user={undefined}
          onLogout={handleLogout}
        >
          <Card className="p-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-4xl mb-4">🏝️</div>
              <h2 className="text-xl font-bold mb-2">Class Not Found</h2>
              <p className="text-muted-foreground">
                Unable to load your class island. Please try again or contact your teacher.
              </p>
            </div>
          </Card>
        </AuthenticatedLayout>
      );
    }

    return errorContent;
  }

  const mainContent = (
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
                  {data?.stats?.totalStudents || 0} students • {data?.stats?.visibleRooms || 0} rooms to visit
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
                        student.passportCode === data.currentStudent && "ring-2 ring-purple-400"
                      )}
                      onClick={() => handleStudentClick(student)}
                    >
                      {/* Avatar */}
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 mb-3 flex items-center justify-center overflow-hidden">
                        <AvatarThumbnail
                          passportCode={student.passportCode}
                          animalType={student.animalType}
                          avatarData={student.avatarData}
                          size={80}
                          showBorder={false}
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
                      {student.passportCode === data.currentStudent && (
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
                        student.passportCode === data.currentStudent && "ring-2 ring-purple-400"
                      )}
                      onClick={() => handleStudentClick(student)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <AvatarThumbnail
                            passportCode={student.passportCode}
                            animalType={student.animalType}
                            avatarData={student.avatarData}
                            size={64}
                            showBorder={false}
                          />
                        </div>
                        
                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{student.studentName}</h3>
                            {student.passportCode === data.currentStudent && (
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
  );

  if (isTeacherView) {
    return (
      <>
        <StudentPassportDialog
          open={showPassportDialog}
          onClose={() => {
            setShowPassportDialog(false);
            setSelectedStudent(null);
          }}
          studentName={selectedStudent?.studentName}
        />
        
        <AuthenticatedLayout 
          showSidebar={true}
          classId={classId}
          className={data.className}
          user={undefined}
          onLogout={handleLogout}
        >
          {/* Remove the full-screen background and adjust for sidebar layout */}
          <div>
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm shadow-sm mb-6">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {data.className} Island
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {data?.stats?.totalStudents || 0} students • {data?.stats?.visibleRooms || 0} rooms to visit
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
            <div className="px-4 py-6">
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
            <div className="px-4 pb-8">
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
                            student.passportCode === data.currentStudent && "ring-2 ring-purple-400"
                          )}
                          onClick={() => handleStudentClick(student)}
                        >
                          {/* Avatar */}
                          <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 mb-3 flex items-center justify-center overflow-hidden">
                            <AvatarThumbnail
                              passportCode={student.passportCode}
                              animalType={student.animalType}
                              avatarData={student.avatarData}
                              size={80}
                              showBorder={false}
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
                          {student.passportCode === data.currentStudent && (
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
                            student.passportCode === data.currentStudent && "ring-2 ring-purple-400"
                          )}
                          onClick={() => handleStudentClick(student)}
                        >
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <AvatarThumbnail
                                passportCode={student.passportCode}
                                animalType={student.animalType}
                                avatarData={student.avatarData}
                                size={64}
                                showBorder={false}
                              />
                            </div>
                            
                            {/* Student Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">{student.studentName}</h3>
                                {student.passportCode === data.currentStudent && (
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
        </AuthenticatedLayout>
      </>
    );
  }

  // For public and student views, use the original layout
  return (
    <>
      <StudentPassportDialog
        open={showPassportDialog}
        onClose={() => {
          setShowPassportDialog(false);
          setSelectedStudent(null);
        }}
        studentName={selectedStudent?.studentName}
      />
      {mainContent}
    </>
  );
}