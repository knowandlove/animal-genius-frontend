import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/config/api";
import { useAuth } from "@/hooks/useAuth";
import { useLastAccessedClass } from "@/hooks/useLastAccessedClass";
import { Trash2, Clipboard, Loader2 } from "lucide-react";
import { getIconComponent } from "@/utils/icon-utils";
import { QuestionIcon } from "@/components/QuestionIcon";
import { TeacherQuizModal } from "@/components/TeacherQuizModal";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { TeacherOnboardingModal } from "@/components/teacher-onboarding-modal";

// Helper function for animal image paths
function getAnimalImagePath(animal: string): string {
  const imageMap: Record<string, string> = {
    'Meerkat': '/images/meerkat.png',
    'Panda': '/images/panda.png',
    'Owl': '/images/owl.png',
    'Beaver': '/images/beaver.png',
    'Elephant': '/images/elephant.png',
    'Otter': '/images/otter.png',
    'Parrot': '/images/parrot.png',
    'Border Collie': '/images/collie.png'
  };
  return imageMap[animal] || '/images/kal-character.png';
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  personalityAnimal?: string;
  isAdmin?: boolean;
}

interface ClassData {
  id: string; // UUID from backend
  name: string;
  code?: string; // Some endpoints return 'code'
  classCode?: string; // Some endpoints return 'classCode'
  submissionCount?: number;
  studentCount?: number; // Backend returns this instead of submissionCount
  createdAt: string;
  iconEmoji?: string;
  iconColor?: string;
  icon?: string; // Backend returns this instead of iconEmoji
  backgroundColor?: string; // Backend returns this instead of iconColor
}

// Map text icons to emojis
const iconMap: Record<string, string> = {
  'book': '📚',
  'pencil': '✏️',
  'star': '⭐',
  'heart': '❤️',
  'music': '🎵',
  'art': '🎨',
  'science': '🔬',
  'math': '🔢',
  'globe': '🌍',
  'computer': '💻',
  'sports': '⚽',
  'nature': '🌿',
  'default': '📚'
};

const getIconEmoji = (iconEmoji?: string, icon?: string): string => {
  if (iconEmoji) return iconEmoji;
  if (icon && iconMap[icon]) return iconMap[icon];
  return iconMap['default'];
};

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading, logout, refreshUser } = useAuth();
  const { saveLastAccessedClass } = useLastAccessedClass();
  const queryClient = useQueryClient();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const {
    data: classes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(api("/api/classes"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }
      return response.json();
    },
    enabled: !!user && !!localStorage.getItem("authToken"),
    retry: 1,
  });

  // Fetch lesson progress for each class
  const { data: classProgress = {} } = useQuery<Record<string, any>>({
    queryKey: ["classProgress", classes?.map((c: any) => c.id)],
    queryFn: async () => {
      if (!classes) return {};
      const progressData: Record<string, any> = {};
      const token = localStorage.getItem("authToken");
      
      await Promise.all(
        classes.map(async (cls: any) => {
          try {
            const response = await fetch(api(`/api/classes/${cls.id}/lessons/progress`), {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              const progress = await response.json();
              progressData[cls.id] = progress;
            } else {
              progressData[cls.id] = { lessons: [], completedLessons: 0, totalLessons: 5 };
            }
          } catch (error) {
            progressData[cls.id] = { lessons: [], completedLessons: 0, totalLessons: 5 };
          }
        })
      );
      
      return progressData;
    },
    enabled: !!classes && classes.length > 0 && !!user,
  });

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Dashboard state:", {
        user: user
          ? `${user.firstName} ${user.lastName} (admin: ${user.isAdmin})`
          : null,
        authToken: !!localStorage.getItem("authToken"),
        classes: Array.isArray(classes)
          ? `${classes.length} classes`
          : "no classes",
        isLoading,
        error: error?.message || "no error",
      });
    }
  }, [user, classes, isLoading, error]);

  // Check if user needs onboarding (first login)
  useEffect(() => {
    if (user && !authLoading && !isLoading) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
      const hasNoClasses = !classes || classes.length === 0;
      
      // Show onboarding if they haven't completed it and have no classes
      if (!hasCompletedOnboarding && hasNoClasses) {
        setShowOnboarding(true);
      }
    }
  }, [user, authLoading, classes, isLoading]);

  const handleLogout = () => {
    logout();
    // The useEffect will handle the redirect when user becomes null
  };

  const copyClassLink = (code: string) => {
    const url = `${window.location.origin}/q/${code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Quiz link has been copied to clipboard.",
    });
  };
  
  const copyClassIslandLink = (code: string) => {
    const url = `${window.location.origin}/class/${code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Island link copied!",
      description: "Class Island link has been copied to clipboard.",
    });
  };

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("Starting delete mutation for class:", classId);
      }
      const result = await apiRequest("DELETE", `/api/classes/${classId}`);
      if (process.env.NODE_ENV === 'development') {
        console.log("Delete mutation completed successfully");
      }
      return result;
    },
    onSuccess: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("Delete mutation onSuccess triggered");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Class deleted",
        description: "Class and all submissions have been permanently deleted",
      });
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error("Delete mutation onError triggered:", error);
      }
      toast({
        title: "Error",
        description: "Failed to delete class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClass = async (classId: string, className: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("handleDeleteClass called with classId:", classId);
    }

    setDeletingClassId(classId);
    try {
      const token = localStorage.getItem("authToken");
      if (process.env.NODE_ENV === 'development') {
        console.log("Token exists:", !!token);
      }

      const response = await fetch(api(`/api/classes/${classId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log("Delete response status:", response.status);
      }

      if (response.ok || response.status === 204) {
        queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
        queryClient.invalidateQueries({ queryKey: ["classProgress"] });
        toast({
          title: "Class deleted",
          description:
            "Class and all submissions have been permanently deleted",
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        if (process.env.NODE_ENV === 'development') {
          console.error("Delete error:", errorData);
        }
        toast({
          title: "Error",
          description: errorData.message || `Failed to delete class (Status: ${response.status})`,
          variant: "destructive",
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error in handleDeleteClass:", error);
      }
      toast({
        title: "Error",
        description: "Failed to delete class. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingClassId(null);
    }
  };
  
  const confirmDeleteClass = (classId: string, className: string, studentCount: number) => {
    confirm({
      title: "Delete Class",
      description: `Are you sure you want to delete "${className}"? This will permanently remove all ${studentCount} student submissions. This action cannot be undone.`,
      confirmText: "Delete Class",
      cancelText: "Cancel",
      variant: "destructive",
      icon: <Trash2 className="h-4 w-4" />,
      onConfirm: () => {
        handleDeleteClass(classId, className);
      },
    });
  };

  

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }


  return (
    <AuthenticatedLayout 
      showSidebar={false}
      user={user}
      onLogout={handleLogout}
    >
      <div 
        className="min-h-screen py-8" 
        style={{
          background: 'linear-gradient(135deg, #d3f2ed 0%, #e8f7f3 40%, #f0faf7 100%)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex items-center gap-4">
                  {user.personalityAnimal ? (
                    <img
                      src={getAnimalImagePath(user.personalityAnimal)}
                      alt={`${user.personalityAnimal} - Teacher Animal`}
                      className="w-32 h-32 flex-shrink-0"
                      onError={(e) => {
                        console.warn(`Failed to load image for ${user.personalityAnimal}, using fallback`);
                        // Final fallback to default character
                        e.currentTarget.src = '/images/kal-character.png';
                      }}
                    />
                  ) : (
                    <div 
                      onClick={() => setShowQuizModal(true)}
                      className="cursor-pointer"
                      title="Take the quiz to discover your teaching animal"
                    >
                      <QuestionIcon className="w-20 h-20" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-heading text-foreground mb-2">
                      Welcome back, {user.firstName}!
                    </h1>
                    <p className="font-body text-muted-foreground">
                      Manage your classes and view student progress
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setLocation("/create-class")}
                  className="mt-4 md:mt-0 flex items-center gap-2"
                >
                  <span className="text-lg font-bold">
                    +
                  </span>
                  Create New Class
                </Button>
              </div>
            </CardContent>
          </Card>



          {/* Classes Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-foreground">
                My Classes :
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 font-body text-muted-foreground">
                  Loading classes...
                </div>
              ) : Array.isArray(classes) && classes.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((cls: ClassData) => (
                    <Card
                      key={cls.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: cls.iconColor || cls.backgroundColor || "#c5d49f" }}
                          >
                            {(() => {
                              const IconComponent = getIconComponent(cls.icon || cls.iconEmoji);
                              return <IconComponent className="w-6 h-6 text-white" />;
                            })()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-xl font-heading text-foreground">
                                {cls.name}
                              </h3>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyClassLink(cls.code || cls.classCode || '')}
                                  title="Copy class link"
                                >
                                  <Clipboard className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmDeleteClass(cls.id, cls.name, cls.submissionCount || cls.studentCount || 0)}
                                  title="Delete class"
                                  disabled={deletingClassId === cls.id}
                                >
                                  {deletingClassId === cls.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className="font-body text-muted-foreground">
                              Class Code:{" "}
                              <span 
                                className="font-semibold"
                                style={{ color: cls.iconColor || cls.backgroundColor || "#c5d49f" }}
                              >
                                {cls.code || cls.classCode}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Total Submissions
                            </span>
                            <span className="text-xl font-bold text-primary">
                              {cls.submissionCount || cls.studentCount || 0}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(((cls.submissionCount || cls.studentCount || 0) / 25) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Learning Lounge Progress
                            </span>
                            <span className="text-lg font-semibold text-primary">
                              {classProgress[cls.id]?.completedLessons || 0}/{classProgress[cls.id]?.totalLessons || 5}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300 text-[#c0b7c8] bg-[#c6e3db]"
                              style={{
                                width: `${((classProgress[cls.id]?.completedLessons || 0) / (classProgress[cls.id]?.totalLessons || 5)) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              saveLastAccessedClass(cls.id);
                              setLocation(`/class/${cls.id}/dashboard`);
                            }}
                          >
                            View Class Dashboard
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setLocation(`/learning-lounge?classId=${cls.id}`)
                            }
                          >
                            Learning Lounge
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setLocation(`/teacher/class/${cls.id}/island`)
                            }
                            className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100"
                          >
                            🏝️ Class Island
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => copyClassIslandLink(cls.code || cls.classCode || '')}
                            className="bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100"
                          >
                            <Clipboard className="h-4 w-4 mr-2" />
                            Copy Island Link
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📚</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No classes yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first class to get started with the Animal
                    Genius Quiz
                  </p>
                  <Button onClick={() => setLocation("/create-class")}>
                    <span className="text-lg font-bold mr-1">
                      +
                    </span>
                    Create Your First Class
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialogComponent />
      
      {/* Teacher Quiz Modal */}
      <TeacherQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onComplete={async (animal) => {
          // Update user's animal in the backend
          try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(api("/api/me/profile"), {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ personalityAnimal: animal }),
            });

            if (response.ok) {
              // Refresh user data
              if (refreshUser) {
                await refreshUser();
              }
              setShowQuizModal(false);
              toast({
                title: "Quiz Complete!",
                description: `Your teaching personality animal is ${animal}!`,
              });
            } else {
              throw new Error("Failed to update profile");
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to save your animal. Please try again.",
              variant: "destructive",
            });
          }
        }}
      />
      
      {/* Onboarding Modal */}
      <TeacherOnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          // Mark onboarding as completed
          if (user) {
            localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
          }
        }}
        teacherName={user?.firstName}
        onOpenQuiz={() => {
          setShowOnboarding(false);
          setShowQuizModal(true);
          // Mark onboarding as completed since they're taking the quiz
          if (user) {
            localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
          }
        }}
      />
    </AuthenticatedLayout>
  );
}
