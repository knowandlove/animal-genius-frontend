import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { apiRequest } from "@/lib/queryClient";
import { Sprout, Search, Grid, List, Monitor, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { getStoredPassportCode, getPassportAuthHeaders } from "@/lib/passport-auth";
import { StudentHeader } from "@/components/StudentHeader";

interface ClassGardenStudent {
  id: string;
  passportCode: string;
  studentName: string;
  animalType: string;
  animalTypeId: string;
  geniusType: string;
  avatarData: any;
  growZone: {
    plotPosition: number;
    cropCount: number;
    readyCrops: number;
  } | null;
}

interface ClassGardenData {
  classId: string;
  className: string;
  classCode?: string;
  students: ClassGardenStudent[];
  currentStudent?: string;
  stats: {
    totalStudents: number;
    totalCrops: number;
    readyToHarvest: number;
  };
  lastWatered?: string;
  isPublicView?: boolean;
}

export default function ClassGarden() {
  const [location, setLocation] = useLocation();
  const { classId, classCode } = useParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const currentPassportCode = getStoredPassportCode();
  
  console.log('ClassGarden params:', { classId, classCode, location });

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authTokenChanged"));
    setLocation("/");
  };

  // Determine view type based on URL and authentication
  const isTeacherView = (location.includes('/teacher/') || location.includes('/dashboard') || location.includes('/classes/')) && classId;
  const isPublicView = location.includes('/class/') && classCode && !location.includes('/classes/');
  const isStudentView = !isTeacherView && !isPublicView && location.includes('/class-garden');
  
  // Use different endpoints based on view type
  let endpoint = '';
  if (isTeacherView && classId) {
    endpoint = `/api/classes/${classId}/garden`;
  } else if (isPublicView && classCode) {
    endpoint = `/api/class/${classCode}/garden`;
  } else if (isStudentView) {
    endpoint = '/api/garden/class';
  }
  
  console.log('ClassGarden endpoint:', endpoint, { isTeacherView, isPublicView, isStudentView });

  // Fetch class garden data
  const { data, isLoading, error } = useQuery<ClassGardenData>({
    queryKey: [endpoint],
    queryFn: async () => {
      if (!endpoint) {
        throw new Error('No endpoint determined for class garden view');
      }
      const response = await apiRequest('GET', endpoint, undefined, {
        headers: getPassportAuthHeaders()
      });
      return response;
    },
    enabled: !!endpoint,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 400) {
        return false;
      }
      return failureCount < 2;
    },
  });
  
  console.log('ClassGarden data:', data);
  if (data?.students) {
    console.log('Students:', data.students);
  }

  // Filter students based on search
  const filteredStudents = data?.students?.filter(student => 
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.animalType.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  console.log('Filtered students:', filteredStudents.length, filteredStudents);

  // Handle student grow zone click
  const handleStudentClick = (student: ClassGardenStudent) => {
    // Navigate to their grow zone in view-only mode
    setLocation(`/garden/${student.passportCode}`);
  };

  // Handle back to own grow zone
  const handleBackToMyZone = () => {
    if (currentPassportCode) {
      setLocation(`/garden/${currentPassportCode}`);
    }
  };

  if (isLoading) {
    const loadingContent = (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-green-50">
        <Card className="p-8">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Loading class garden...</p>
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
            <span className="ml-2">Loading class garden...</span>
          </div>
        </AuthenticatedLayout>
      );
    }

    return loadingContent;
  }

  if (error || !data) {
    const errorContent = (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-green-50">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">🌱</div>
            <h2 className="text-xl font-bold mb-2">Garden Not Found</h2>
            <p className="text-muted-foreground">
              Unable to load your class garden. Please try again or contact your teacher.
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
              <div className="text-4xl mb-4">🌱</div>
              <h2 className="text-xl font-bold mb-2">Garden Not Found</h2>
              <p className="text-muted-foreground">
                Unable to load your class garden. Please try again.
              </p>
            </div>
          </Card>
        </AuthenticatedLayout>
      );
    }

    return errorContent;
  }

  const mainContent = (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-green-50">
      {/* Student Header - shows logged in student info */}
      {isStudentView && currentPassportCode && <StudentHeader />}
      
      {/* Garden Header */}
      <div className={cn(
        "bg-white/80 backdrop-blur-sm shadow-sm sticky z-10",
        isStudentView && currentPassportCode ? "top-14" : "top-0"
      )}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isStudentView && currentPassportCode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleBackToMyZone}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  My Grow Zone
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {data.className} Garden
                </h1>
                <p className="text-sm text-muted-foreground">
                  {data?.stats?.totalStudents || 0} grow zones • {data?.stats?.totalCrops || 0} crops growing • {data?.stats?.readyToHarvest || 0} ready to harvest
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isTeacherView && classId && (
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/classes/${classId}/live`)}
                  className="flex items-center gap-2"
                >
                  <Monitor className="w-4 h-4" />
                  Quiz Results Live View
                </Button>
              )}
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
        <p className="mb-4">Showing {filteredStudents.length} students</p>
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
                      student.passportCode === currentPassportCode && "ring-2 ring-green-400"
                    )}
                    onClick={() => handleStudentClick(student)}
                  >
                    {/* Mini Garden Preview */}
                    <div className="aspect-square rounded-lg bg-gradient-to-b from-sky-200 to-green-100 mb-3 p-2 relative overflow-hidden">
                      {student.growZone ? (
                        <>
                          <div className="grid grid-cols-3 gap-1 h-full">
                            {[...Array(9)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "rounded bg-amber-700/20",
                                  i < (student.growZone?.cropCount || 0) && "bg-green-400/40"
                                )}
                              />
                            ))}
                          </div>
                          {student.growZone && student.growZone.readyCrops > 0 && (
                            <div className="absolute top-1 right-1 bg-yellow-400 text-xs px-1 rounded">
                              {student.growZone!.readyCrops} 🌾
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          <Sprout className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* Student Info */}
                    <h3 className="font-semibold text-sm truncate">{student.studentName}</h3>
                    <div className="flex items-center justify-between mt-1">
                      {student.growZone ? (
                        <>
                          <span className="text-xs text-muted-foreground">
                            Zone #{(student.growZone?.plotPosition || 0) + 1}
                          </span>
                          <Badge variant="outline" className="text-xs py-0">
                            {student.growZone?.cropCount || 0} crops
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No Garden Yet
                        </Badge>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {filteredStudents.map((student) => (
              <Card
                key={student.id}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md",
                  student.passportCode === currentPassportCode && "ring-2 ring-green-400"
                )}
                onClick={() => handleStudentClick(student)}
              >
                <div className="flex items-center gap-4">
                  {/* Mini Garden Preview */}
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-sky-200 to-green-100 p-1 relative flex-shrink-0">
                    {student.growZone ? (
                      <div className="grid grid-cols-3 gap-0.5 h-full">
                        {[...Array(9)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "rounded-sm bg-amber-700/20",
                              i < (student.growZone?.cropCount || 0) && "bg-green-400/40"
                            )}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <Sprout className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  
                  {/* Student Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{student.studentName}</h3>
                      <div className="flex items-center gap-2">
                        {student.growZone ? (
                          <>
                            <Badge variant="outline">
                              Zone #{(student.growZone?.plotPosition || 0) + 1}
                            </Badge>
                            {student.growZone && student.growZone.readyCrops > 0 && (
                              <Badge variant="secondary">
                                {student.growZone!.readyCrops} ready
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="secondary">
                            No Garden Yet
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {student.animalType} • {student.growZone ? `${student.growZone.cropCount} crops growing` : 'No crops planted'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isTeacherView) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        className={data.className}
        user={undefined}
        onLogout={handleLogout}
      >
        <div>
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm shadow-sm mb-6">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Class Garden</h1>
                  <p className="text-sm text-muted-foreground">
                    {data?.stats?.totalStudents || 0} grow zones • {data?.stats?.totalCrops || 0} crops growing
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

          {/* Rest of content without full background */}
          <div className="px-4">
            {/* Search Bar */}
            <div className="max-w-md mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Students Grid/List */}
            <p className="mb-4">Showing {filteredStudents.length} students</p>
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
                          student.passportCode === currentPassportCode && "ring-2 ring-green-400"
                        )}
                        onClick={() => handleStudentClick(student)}
                      >
                        {/* Mini Garden Preview */}
                        <div className="aspect-square rounded-lg bg-gradient-to-b from-sky-200 to-green-100 mb-3 p-2 relative overflow-hidden">
                          {student.growZone ? (
                            <>
                              <div className="grid grid-cols-3 gap-1 h-full">
                                {[...Array(9)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "rounded bg-amber-700/20",
                                      i < (student.growZone?.cropCount || 0) && "bg-green-400/40"
                                    )}
                                  />
                                ))}
                              </div>
                              {student.growZone && student.growZone.readyCrops > 0 && (
                                <div className="absolute top-1 right-1 bg-yellow-400 text-xs px-1 rounded">
                                  {student.growZone!.readyCrops} 🌾
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                              <Sprout className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        
                        {/* Student Info */}
                        <h3 className="font-semibold text-sm truncate">{student.studentName}</h3>
                        <div className="flex items-center justify-between mt-1">
                          {student.growZone ? (
                            <>
                              <span className="text-xs text-muted-foreground">
                                Zone #{(student.growZone?.plotPosition || 0) + 1}
                              </span>
                              <Badge variant="outline" className="text-xs py-0">
                                {student.growZone?.cropCount || 0} crops
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              No Garden Yet
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl mx-auto">
                {filteredStudents.map((student) => (
                  <Card
                    key={student.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:shadow-md",
                      student.passportCode === currentPassportCode && "ring-2 ring-green-400"
                    )}
                    onClick={() => handleStudentClick(student)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Mini Garden Preview */}
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-sky-200 to-green-100 p-1 relative flex-shrink-0">
                        {student.growZone ? (
                          <div className="grid grid-cols-3 gap-0.5 h-full">
                            {[...Array(9)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "rounded-sm bg-amber-700/20",
                                  i < (student.growZone?.cropCount || 0) && "bg-green-400/40"
                                )}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <Sprout className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      
                      {/* Student Details */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{student.studentName}</h3>
                          <div className="flex items-center gap-2">
                            {student.growZone ? (
                              <>
                                <Badge variant="outline">
                                  Zone #{(student.growZone?.plotPosition || 0) + 1}
                                </Badge>
                                {student.growZone && student.growZone.readyCrops > 0 && (
                                  <Badge variant="secondary">
                                    {student.growZone!.readyCrops} ready
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <Badge variant="secondary">
                                No Garden Yet
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {student.animalType} • {student.growZone ? `${student.growZone.cropCount} crops growing` : 'No crops planted'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return mainContent;
}