import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAnimalByName } from "@/lib/animals";
import { apiRequest } from "@/lib/queryClient";
import { getAssetUrl } from "@/utils/cloud-assets";
import { getIconComponent, getIconColor } from "@/utils/icon-utils";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { InteractivePieChart } from "@/components/interactive-pie-chart";
import { Monitor, Upload, Eye, Volume2, Zap, BookOpen, MapPin, Coins, Plus, Minus, Store, Settings } from "lucide-react";
import { CSVImportModal } from "@/components/CSVImportModal";
import { PermissionGate } from "@/components/ui/permission-gate";
import { useClassContext } from "@/hooks/useClassContext";
import { useAuth } from "@/hooks/useAuth";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Submission {
  id: number;
  studentName: string;
  gradeLevel: string;
  personalityType: string;
  animalType: string;
  animalGenius: string;
  geniusType: string; // Add both for compatibility
  learningStyle: string;
  learningScores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    readingWriting: number;
  };
  completedAt: string;
  passportCode?: string;
  currencyBalance?: number;
}

interface ClassAnalyticsData {
  class: {
    id: number;
    name: string;
    code: string;
    teacherId: number;
    iconEmoji?: string;
    iconColor?: string;
    icon?: string;
    backgroundColor?: string;
  };
  stats: {
    totalSubmissions: number;
    animalDistribution: Record<string, number>;
    personalityDistribution: Record<string, number>;
    learningStyleDistribution: Record<string, number>;
    animalGeniusDistribution?: Record<string, number>;
    geniusTypeDistribution?: Record<string, number>;
  };
  submissions: Submission[];
}

export default function ClassAnalytics() {
  const { classId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { role } = useClassContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(
    null,
  );
  const [selectedGenius, setSelectedGenius] = useState<string | null>(null);
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<
    string | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { user, isLoading: authLoading } = useAuth();
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  
  // Currency management state
  const [selectedStudent, setSelectedStudent] = useState<Submission | null>(null);
  const [currencyAction, setCurrencyAction] = useState<'give' | 'take'>('give');
  const [currencyAmount, setCurrencyAmount] = useState<string>('');
  const [currencyReason, setCurrencyReason] = useState<string>('');
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [showCurrencySection, setShowCurrencySection] = useState(false);
  
  const itemsPerPage = 10;
  
  // Permission checks based on role
  const isOwner = role === 'owner';
  const canEdit = role === 'owner' || role === 'editor';
  const canManageStudents = isOwner || (role === 'editor' && true); // TODO: Check specific permissions
  const canManageEconomy = isOwner || (role === 'editor' && true); // TODO: Check specific permissions
  const canExportData = isOwner || (role === 'editor' && true); // TODO: Check specific permissions

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    // Dispatch custom event to update router state
    window.dispatchEvent(new Event("authTokenChanged"));

    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
    setLocation("/");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  // Class analytics query
  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery<ClassAnalyticsData>({
    queryKey: [`/api/classes/${classId}/analytics`],
    enabled: !!classId && !!localStorage.getItem("authToken"),
  });

  // Delete submission mutation
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (submissionId: number) => {
      await apiRequest("DELETE", `/api/submissions/${submissionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student submission deleted successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/classes/${classId}/analytics`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete submission",
        variant: "destructive",
      });
    },
  });

  // Currency management mutations
  const currencyMutation = useMutation({
    mutationFn: async ({ action, submissionId, amount, reason }: {
      action: 'give' | 'take';
      submissionId: number;
      amount: number;
      reason: string;
    }) => {
      return await apiRequest('POST', `/api/currency/${action}`, {
        submissionId,
        amount,
        reason
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/classes/${classId}/analytics`],
      });
      setIsCurrencyModalOpen(false);
      setCurrencyAmount('');
      setCurrencyReason('');
      setSelectedStudent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update currency",
        variant: "destructive",
      });
    },
  });

  const storeToggleMutation = useMutation({
    mutationFn: async (isOpen: boolean) => {
      return await apiRequest('POST', '/api/currency/store/toggle', {
        classId: parseInt(classId!),
        isOpen
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle store",
        variant: "destructive",
      });
    },
  });

  // Filter submissions based on search term, selected animal, personality type, genius, and learning style
  const filteredSubmissions = useMemo(() => {
    if (!analyticsData?.submissions) return [];
    return analyticsData.submissions.filter((submission) => {
      const matchesSearch = submission.studentName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesAnimal =
        !selectedAnimal || submission.animalType === selectedAnimal;
      const matchesPersonality =
        !selectedPersonality ||
        (selectedPersonality === "E" &&
          submission.personalityType[0] === "E") ||
        (selectedPersonality === "I" && submission.personalityType[0] === "I");
      const matchesGenius =
        !selectedGenius || (submission.geniusType || submission.animalGenius) === selectedGenius;
      const matchesLearningStyle =
        !selectedLearningStyle ||
        submission.learningStyle === selectedLearningStyle;
      return (
        matchesSearch &&
        matchesAnimal &&
        matchesPersonality &&
        matchesGenius &&
        matchesLearningStyle
      );
    });
  }, [
    analyticsData?.submissions,
    searchTerm,
    selectedAnimal,
    selectedPersonality,
    selectedGenius,
    selectedLearningStyle,
  ]);

  // Animal color mapping and SVG paths
  const animalColors: Record<string, { color: string; svg: string }> = {
    Meerkat: { color: "#4B4959", svg: getAssetUrl("/images/meerkat.svg") },
    Panda: { color: "#82BCC8", svg: getAssetUrl("/images/panda.png") },
    Owl: { color: "#BAC97D", svg: getAssetUrl("/images/owl.png") },
    Beaver: { color: "#829B79", svg: getAssetUrl("/images/beaver.svg") },
    Elephant: { color: "#BD85C8", svg: getAssetUrl("/images/elephant.png") },
    Otter: { color: "#FACC7D", svg: getAssetUrl("/images/otter.png") },
    Parrot: { color: "#FF8070", svg: getAssetUrl("/images/parrot.png") },
    "Border Collie": { color: "#DEA77E", svg: getAssetUrl("/images/collie.png") },
  };

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    if (!analyticsData?.stats.animalDistribution) return [];
    return Object.entries(analyticsData.stats.animalDistribution).map(
      ([animal, count]) => {
        const animalInfo = animalColors[animal] || {
          color: "#6366F1",
          svg: getAssetUrl("/images/meerkat.svg"),
        };
        // Use Math.floor for Border Collie to show 10% instead of 11%
        const percentage =
          animal === "Border Collie"
            ? Math.floor((count / analyticsData.stats.totalSubmissions) * 100)
            : Math.round((count / analyticsData.stats.totalSubmissions) * 100);
        return {
          name: animal,
          value: count,
          percentage,
          color: animalInfo.color,
          svg: animalInfo.svg,
        };
      },
    );
  }, [
    analyticsData?.stats.animalDistribution,
    analyticsData?.stats.totalSubmissions,
  ]);

  // Calculate personality preferences for the widget
  const personalityPreferences = useMemo(() => {
    if (!analyticsData?.submissions) return null;

    const prefs = {
      EI: { E: 0, I: 0 },
      SN: { S: 0, N: 0 },
      TF: { T: 0, F: 0 },
      JP: { J: 0, P: 0 },
    };

    analyticsData.submissions.forEach((submission) => {
      const type = submission.personalityType;
      prefs.EI[type[0] as "E" | "I"]++;
      prefs.SN[type[1] as "S" | "N"]++;
      prefs.TF[type[2] as "T" | "F"]++;
      prefs.JP[type[3] as "J" | "P"]++;
    });

    return prefs;
  }, [analyticsData?.submissions]);

  // Prepare personality pie chart data
  const personalityPieChartData = useMemo(() => {
    if (!personalityPreferences?.EI || !analyticsData?.stats.totalSubmissions)
      return [];
    return [
      {
        name: "E",
        value: personalityPreferences.EI.E,
        percentage: Math.round(
          (personalityPreferences.EI.E / analyticsData.stats.totalSubmissions) *
            100,
        ),
        color: "#3B82F6",
        svg: "/images/parrot.png",
      },
      {
        name: "I",
        value: personalityPreferences.EI.I,
        percentage: Math.round(
          (personalityPreferences.EI.I / analyticsData.stats.totalSubmissions) *
            100,
        ),
        color: "#10B981",
        svg: "/images/owl.png",
      },
    ].filter((item) => item.value > 0);
  }, [personalityPreferences?.EI, analyticsData?.stats.totalSubmissions]);

  // Prepare Animal Genius pie chart data
  const animalGeniusPieChartData = useMemo(() => {
    if (
      !(analyticsData?.stats.geniusTypeDistribution || analyticsData?.stats.animalGeniusDistribution) ||
      !analyticsData?.stats.totalSubmissions
    )
      return [];

    const geniusColors = {
      Thinker: "#8B5CF6",
      Feeler: "#10B981",
      Doer: "#F59E0B",
    };

    return Object.entries(analyticsData.stats.geniusTypeDistribution || analyticsData.stats.animalGeniusDistribution || {})
      .map(([genius, count]) => ({
        name: genius,
        value: count,
        percentage: Math.round(
          (count / analyticsData.stats.totalSubmissions) * 100,
        ),
        color: geniusColors[genius as keyof typeof geniusColors] || "#6B7280",
        svg: genius === "Thinker" ? "/images/owl.png" : genius === "Feeler" ? "/images/elephant.png" : "/images/otter.png",
      }))
      .filter((item) => item.value > 0);
  }, [
    analyticsData?.stats.geniusTypeDistribution,
    analyticsData?.stats.animalGeniusDistribution,
    analyticsData?.stats.totalSubmissions,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubmissions, currentPage, itemsPerPage]);

  const handleDeleteSubmission = (submissionId: number) => {
    if (
      confirm(
        "Are you sure you want to delete this student's submission? This action cannot be undone.",
      )
    ) {
      deleteSubmissionMutation.mutate(submissionId);
    }
  };

  const copyShareLink = () => {
    if (!analyticsData?.class?.code) return;

    const shareUrl = `${window.location.origin}/q/${analyticsData.class.code}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Class link copied to clipboard",
      });
    });
  };

  // Handle loading and error states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        className={undefined}
        classCode={undefined}
        user={user}
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center py-16">
          <div>Loading class analytics...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !analyticsData) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        user={user}
        onLogout={handleLogout}
      >
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Class Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error ? (error as any).message : "The class you're looking for doesn't exist or you don't have access to it."}
          </p>
          {classId && (
            <p className="text-sm text-gray-500 mb-4">
              Class ID: {classId}
            </p>
          )}
          <Button onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout 
      showSidebar={true}
      classId={classId}
      className={analyticsData?.class?.name}
      classCode={analyticsData?.class?.code}
      user={user}
      onLogout={handleLogout}
    >
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getIconColor(analyticsData?.class?.backgroundColor || analyticsData?.class?.iconColor || "#c5d49f") }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(analyticsData?.class?.icon || analyticsData?.class?.iconEmoji || "📚");
                    return <IconComponent className="w-8 h-8 text-white" />;
                  })()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {analyticsData?.class?.name || "Class"} - Analytics
                  </h1>
                  <p className="text-gray-600">
                    Class Code: {analyticsData?.class?.code || ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setLocation(`/class/${classId}/settings`)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  ← Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Class Overview</span>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/class-report/${classId}`)}
                  className="flex items-center gap-2"
                >
                  View Class Report
                </Button>
                {/* Live Discovery Board - temporarily hidden
                <Button 
                  onClick={() => setLocation(`/classes/${classId}/live`)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Monitor className="h-4 w-4" />
                  Live Discovery Board
                </Button>
                */}
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/group-maker?classId=${classId}&from=analytics`)}
                  className="flex items-center gap-2"
                >
                  Groups & Seating
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/classes/${classId}/economy`)}
                  className="flex items-center gap-2"
                >
                  <Coins className="h-4 w-4" />
                  Class Economy
                </Button>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600 text-[22px]">Total Submissions:</span>
                  <span className="font-bold text-blue-600 text-[27px]">
                    {analyticsData.stats.totalSubmissions}
                  </span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData?.stats?.totalSubmissions > 0 ? (
              <>
                {/* Charts Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Distribution Charts
                    </h3>
                    <div className="flex gap-2">
                      {selectedAnimal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAnimal(null)}
                          className="text-sm"
                        >
                          Clear Animal Filter ({selectedAnimal})
                        </Button>
                      )}
                      {selectedPersonality && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPersonality(null)}
                          className="text-sm"
                        >
                          Clear Personality Filter ({selectedPersonality})
                        </Button>
                      )}
                      {selectedGenius && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGenius(null)}
                          className="text-sm"
                        >
                          Clear Genius Filter ({selectedGenius})
                        </Button>
                      )}
                      {selectedLearningStyle && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLearningStyle(null)}
                          className="text-sm"
                        >
                          Clear Learning Style Filter (
                          {selectedLearningStyle === "readingWriting"
                            ? "Reading/Writing"
                            : selectedLearningStyle}
                          )
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-6">
                    {/* Animal List - Left Column */}
                    <div className="text-left pl-[0px] pr-[0px] pt-[10px] pb-[10px]">
                      <h4 className="text-md font-medium text-gray-700 mb-3">
                        Click an animal to filter submissions
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(
                          analyticsData?.stats?.animalDistribution || {},
                        ).map(([animalName, count]) => {
                          const animalInfo = animalColors[animalName] || {
                            color: "#6366F1",
                            svg: "/images/meerkat.svg",
                          };
                          const percentage = Math.round(
                            (count /
                              (analyticsData?.stats?.totalSubmissions || 1)) *
                              100,
                          );
                          const isSelected = selectedAnimal === animalName;

                          return (
                            <div
                              key={animalName}
                              className={`cursor-pointer p-3 bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => {
                                setSelectedPersonality(null); // Clear personality filter
                                setSelectedAnimal(
                                  isSelected ? null : animalName,
                                );
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8">
                                    <img 
                                      src={animalInfo.svg} 
                                      alt={animalName} 
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm">
                                      {animalName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {percentage}%
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xl font-bold text-blue-600">
                                  {count}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Charts - Right Columns */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Animal Distribution Pie Chart */}
                      <div className="relative">
                        <h4 className="text-md font-medium text-gray-700 mb-3">
                          Animal Types
                        </h4>
                        <div className="bg-white rounded-lg shadow-sm border p-4">
                          <InteractivePieChart
                            data={pieChartData}
                            selectedAnimal={selectedAnimal}
                            onAnimalClick={(animal) => {
                              setSelectedPersonality(null); // Clear personality filter
                              setSelectedAnimal(animal);
                            }}
                          />
                        </div>
                      </div>

                      {/* Animal Genius Distribution Pie Chart */}
                      <div className="relative">
                        <h4 className="text-md font-medium text-gray-700 mb-3">
                          Animal Genius
                        </h4>
                        <div className="bg-white rounded-lg shadow-sm border p-4">
                          <InteractivePieChart
                            data={animalGeniusPieChartData}
                            selectedAnimal={selectedGenius}
                            onAnimalClick={(genius) => {
                              setSelectedAnimal(null); // Clear other filters
                              setSelectedPersonality(null);
                              setSelectedLearningStyle(null);
                              setSelectedGenius(genius);
                            }}
                          />
                        </div>
                      </div>

                      {/* Personality Distribution Pie Chart */}
                      <div className="relative">
                        <h4 className="text-md font-medium text-gray-700 mb-3">
                          Extroversion vs Introversion
                        </h4>
                        <div className="bg-white rounded-lg shadow-sm border p-4">
                          <InteractivePieChart
                            data={personalityPieChartData}
                            selectedAnimal={selectedPersonality}
                            onAnimalClick={(personality) => {
                              setSelectedAnimal(null); // Clear animal filter
                              setSelectedPersonality(personality);
                            }}
                          />
                        </div>
                      </div>

                      {/* Learning Style Distribution */}
                      <div className="md:col-span-3 mt-6">
                        <h4 className="text-md font-medium text-gray-700 mb-3">
                          Learning Styles
                        </h4>
                        <div className="bg-white rounded-lg shadow-sm border p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(
                              analyticsData.stats.learningStyleDistribution ||
                                {},
                            ).map(([style, count]) => {
                              const percentage =
                                analyticsData.stats.totalSubmissions > 0
                                  ? Math.round(
                                      (count /
                                        analyticsData.stats.totalSubmissions) *
                                        100,
                                    )
                                  : 0;
                              
                              // Learning style icon mapping using lucide icons
                              const learningStyleIcons = {
                                "Visual": {
                                  name: "Visual",
                                  color: "#4F46E5",
                                  icon: "Eye", // Eye icon for visual learners
                                },
                                "Auditory": {
                                  name: "Auditory", 
                                  color: "#059669",
                                  icon: "Volume2", // Speaker icon for auditory learners
                                },
                                "Kinesthetic": {
                                  name: "Kinesthetic",
                                  color: "#DC2626", 
                                  icon: "Zap", // Lightning icon for kinesthetic learners
                                },
                                "Reading/Writing": {
                                  name: "Reading/Writing",
                                  color: "#7C2D12",
                                  icon: "BookOpen", // Book icon for reading/writing learners
                                },
                              };

                              // Icon component mapping for dynamic rendering
                              const iconComponents = {
                                Eye,
                                Volume2,
                                Zap,
                                BookOpen,
                                Monitor,
                              };
                              
                              // Get style info with proper fallback
                              const styleInfo = learningStyleIcons[style as keyof typeof learningStyleIcons] || {
                                name: style.charAt(0).toUpperCase() + style.slice(1),
                                color: "#6B7280",
                                icon: "Monitor",
                              };

                              return (
                                <div
                                  key={style}
                                  className={`text-center p-3 rounded-lg cursor-pointer transition-all ${
                                    selectedLearningStyle === style
                                      ? "bg-blue-100 border-2 border-blue-400"
                                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                                  }`}
                                  onClick={() => {
                                    setSelectedAnimal(null); // Clear other filters
                                    setSelectedPersonality(null);
                                    setSelectedGenius(null);
                                    setSelectedLearningStyle(
                                      selectedLearningStyle === style
                                        ? null
                                        : style,
                                    );
                                  }}
                                >
                                  <div className="w-8 h-8 mb-1 mx-auto">
                                    {(() => {
                                      const IconComponent = iconComponents[styleInfo.icon as keyof typeof iconComponents];
                                      return IconComponent ? (
                                        <IconComponent 
                                          className="w-full h-full" 
                                          style={{ color: styleInfo.color }}
                                        />
                                      ) : null;
                                    })()}
                                  </div>
                                  <div className="font-medium text-sm">
                                    {styleInfo.name}
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    {count} students
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-gray-200">
                                    <div
                                      className="h-full rounded-full transition-all duration-300"
                                      style={{
                                        backgroundColor: styleInfo.color,
                                        width: `${percentage}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {percentage}%
                                  </div>
                                </div>
                              );
                        })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Student Submissions Table */}
                {analyticsData.submissions &&
                  analyticsData.submissions.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Student Submissions
                            {(selectedAnimal || selectedPersonality) && (
                              <span className="text-sm font-normal text-blue-600 ml-2">
                                (Filtered by{" "}
                                {[selectedAnimal, selectedPersonality]
                                  .filter(Boolean)
                                  .join(" & ")}
                                : {filteredSubmissions.length} students)
                              </span>
                            )}
                          </h3>
                          {!selectedAnimal && !selectedPersonality && (
                            <p className="text-sm text-gray-500 mt-1">
                              Showing {filteredSubmissions.length} of{" "}
                              {analyticsData.submissions.length} submissions
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <PermissionGate 
                            canAccess={canManageStudents}
                            tooltip="Only class owners and editors can import students"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsCSVModalOpen(true)}
                              className="flex items-center gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              Import CSV
                            </Button>
                          </PermissionGate>
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Animal
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Animal Genius
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Learning Style
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Completed
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Island
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Coins
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {paginatedSubmissions.map(
                              (submission: Submission) => {
                                const animal = getAnimalByName(
                                  submission.animalType,
                                );
                                return (
                                  <tr
                                    key={submission.id}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <button
                                        onClick={() => setLocation(`/teacher/student/${submission.id}?classId=${classId}&from=analytics`)}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      >
                                        {submission.studentName}
                                      </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 mr-2">
                                          <img 
                                            src={animalColors[submission.animalType]?.svg || getAssetUrl("/images/meerkat.svg")} 
                                            alt={submission.animalType} 
                                            className="w-full h-full object-contain" 
                                          />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                          {animal?.name ||
                                            submission.animalType}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                                        style={{
                                          backgroundColor:
                                            (submission.geniusType || submission.animalGenius) ===
                                            "Thinker"
                                              ? "#8B5CF6"
                                              : (submission.geniusType || submission.animalGenius) ===
                                                  "Feeler"
                                                ? "#10B981"
                                                : "#F59E0B",
                                        }}
                                      >
                                        {submission.geniusType || submission.animalGenius || 'Unknown'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                                        {submission.learningStyle ===
                                        "readingWriting"
                                          ? "Reading/Writing"
                                          : submission.learningStyle
                                              .charAt(0)
                                              .toUpperCase() +
                                            submission.learningStyle.slice(1)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {format(
                                        new Date(submission.completedAt),
                                        "MMM d, yyyy h:mm a",
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {submission.passportCode ? (
                                        <button
                                          onClick={() => setLocation(`/island/${submission.passportCode}`)}
                                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                          title={`Visit ${submission.studentName}'s Island`}
                                        >
                                          <MapPin className="w-4 h-4" />
                                          <span className="font-mono text-xs">{submission.passportCode}</span>
                                        </button>
                                      ) : (
                                        <span className="text-gray-400 text-xs">No passport</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      <div className="flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-yellow-600" />
                                        <span className="font-semibold">
                                          {submission.currencyBalance || 0}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setLocation(
                                            `/teacher/student/${submission.id}?classId=${classId}&from=analytics`,
                                          )
                                        }
                                      >
                                        View Profile
                                      </Button>
                                      {showCurrencySection && (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedStudent(submission);
                                              setCurrencyAction('give');
                                              setIsCurrencyModalOpen(true);
                                            }}
                                            className="text-green-600 hover:text-green-700"
                                          >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Give
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedStudent(submission);
                                              setCurrencyAction('take');
                                              setIsCurrencyModalOpen(true);
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Minus className="w-3 h-3 mr-1" />
                                            Take
                                          </Button>
                                        </>
                                      )}
                                      <PermissionGate 
                                        canAccess={canManageStudents}
                                        tooltip="Only class owners and editors can delete students"
                                      >
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() =>
                                            handleDeleteSubmission(submission.id)
                                          }
                                        >
                                          Delete
                                        </Button>
                                      </PermissionGate>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                          <div className="flex justify-between flex-1 sm:hidden">
                            <Button
                              variant="outline"
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(prev + 1, totalPages),
                                )
                              }
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-gray-700">
                                Showing{" "}
                                <span className="font-medium">
                                  {(currentPage - 1) * itemsPerPage + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium">
                                  {Math.min(
                                    currentPage * itemsPerPage,
                                    filteredSubmissions.length,
                                  )}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium">
                                  {filteredSubmissions.length}
                                </span>{" "}
                                results
                              </p>
                            </div>
                            <div>
                              <nav
                                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                                aria-label="Pagination"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.max(prev - 1, 1),
                                    )
                                  }
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </Button>
                                {Array.from(
                                  { length: Math.min(totalPages, 5) },
                                  (_, i) => {
                                    const page = i + 1;
                                    return (
                                      <Button
                                        key={page}
                                        variant={
                                          currentPage === page
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                      >
                                        {page}
                                      </Button>
                                    );
                                  },
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.min(prev + 1, totalPages),
                                    )
                                  }
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </Button>
                              </nav>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Students haven't started taking the quiz yet. Share your
                    class link to get started!
                  </p>
                  <Button onClick={copyShareLink}>
                    <span className="mr-2">📋</span>Copy Class Link
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            <span className="mr-2">←</span>Back to Dashboard
          </Button>
        </div>
      
      {/* Currency Management Section */}
      {showCurrencySection && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Store Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => storeToggleMutation.mutate(true)}
                disabled={storeToggleMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                Open Store
              </Button>
              <Button
                onClick={() => storeToggleMutation.mutate(false)}
                disabled={storeToggleMutation.isPending}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                Close Store
              </Button>
              <p className="text-sm text-gray-600">
                Control when students can browse and request items from the store.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currency Management Modal */}
      <Dialog open={isCurrencyModalOpen} onOpenChange={setIsCurrencyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currencyAction === 'give' ? 'Give Coins' : 'Take Coins'} - {selectedStudent?.studentName}
            </DialogTitle>
            <DialogDescription>
              {currencyAction === 'give' 
                ? 'Award coins to this student for good behavior, participation, or achievements.'
                : 'Remove coins from this student if needed.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max={currencyAction === 'give' ? "1000" : selectedStudent?.currencyBalance || "0"}
                value={currencyAmount}
                onChange={(e) => setCurrencyAmount(e.target.value)}
                className="col-span-3"
                placeholder={currencyAction === 'give' ? "Enter coins to give" : "Enter coins to take"}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Select value={currencyReason} onValueChange={setCurrencyReason}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {currencyAction === 'give' ? (
                    <>
                      <SelectItem value="Good behavior">Good behavior</SelectItem>
                      <SelectItem value="Great participation">Great participation</SelectItem>
                      <SelectItem value="Excellent work">Excellent work</SelectItem>
                      <SelectItem value="Helping others">Helping others</SelectItem>
                      <SelectItem value="Improvement">Amazing improvement</SelectItem>
                      <SelectItem value="Teacher bonus">Teacher bonus</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Inappropriate behavior">Inappropriate behavior</SelectItem>
                      <SelectItem value="Not following rules">Not following rules</SelectItem>
                      <SelectItem value="Teacher adjustment">Teacher adjustment</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedStudent && (
              <div className="text-sm text-gray-600 text-center">
                Current balance: <span className="font-semibold">{selectedStudent.currencyBalance || 0} coins</span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCurrencyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedStudent || !currencyAmount || !currencyReason) return;
                
                currencyMutation.mutate({
                  action: currencyAction,
                  submissionId: selectedStudent.id,
                  amount: parseInt(currencyAmount),
                  reason: currencyReason
                });
              }}
              disabled={!currencyAmount || !currencyReason || currencyMutation.isPending}
              className={currencyAction === 'give' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {currencyMutation.isPending ? 'Processing...' : 
               currencyAction === 'give' ? 'Give Coins' : 'Take Coins'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        classId={classId!}
        onImportComplete={() => {
          queryClient.invalidateQueries({
            queryKey: [`/api/classes/${classId}/analytics`],
          });
        }}
      />
    </AuthenticatedLayout>
  );
}
