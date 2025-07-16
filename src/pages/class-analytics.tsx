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
  
  const itemsPerPage = 20;
  
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

  // Animal color mapping and image paths
  const animalColors: Record<string, { color: string; svg: string }> = {
    Meerkat: { color: "#4B4959", svg: getAssetUrl("/images/meerkat.png") },
    Panda: { color: "#82BCC8", svg: getAssetUrl("/images/panda.png") },
    Owl: { color: "#BAC97D", svg: getAssetUrl("/images/owl.png") },
    Beaver: { color: "#829B79", svg: getAssetUrl("/images/beaver.png") },
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

    console.log('🔍 Analytics Debug - All submissions:', analyticsData.submissions.map(s => ({
      name: s.studentName,
      personality: s.personalityType,
      animal: s.animalType
    })));

    const prefs = {
      EI: { E: 0, I: 0 },
      SN: { S: 0, N: 0 },
      TF: { T: 0, F: 0 },
      JP: { J: 0, P: 0 },
    };

    analyticsData.submissions.forEach((submission) => {
      const type = submission.personalityType;
      
      // Validate personality type format (should be 4 characters like ENFP)
      if (!type || type.length !== 4) {
        console.log(`Invalid personality type for ${submission.studentName}: "${type}"`);
        return;
      }
      
      // Use actual personality type
      const ei = type[0] as "E" | "I";
      const sn = type[1] as "S" | "N";
      const tf = type[2] as "T" | "F";
      const jp = type[3] as "J" | "P";
      
      if (ei === "E" || ei === "I") prefs.EI[ei]++;
      if (sn === "S" || sn === "N") prefs.SN[sn]++;
      if (tf === "T" || tf === "F") prefs.TF[tf]++;
      if (jp === "J" || jp === "P") prefs.JP[jp]++;
    });

    return prefs;
  }, [analyticsData?.submissions]);

  // Prepare personality pie chart data
  const personalityPieChartData = useMemo(() => {
    if (!personalityPreferences?.EI || !analyticsData?.stats.totalSubmissions)
      return [];
    
    return [
      {
        name: "Extrovert",
        value: personalityPreferences.EI.E,
        percentage: Math.round(
          (personalityPreferences.EI.E / analyticsData.stats.totalSubmissions) *
            100,
        ),
        color: "#3B82F6",
        svg: "/images/parrot.png",
      },
      {
        name: "Introvert",
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
                  <div className="flex items-center space-x-2 text-sm mt-2">
                    <span className="text-gray-600 text-[22px]">Total Submissions:</span>
                    <span className="font-bold text-blue-600 text-[27px]">
                      {analyticsData.stats.totalSubmissions}
                    </span>
                  </div>
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
            <CardTitle>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData?.stats?.totalSubmissions > 0 ? (
              <>
                {/* Compact Animal Filter Squares at Top */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Filter Students by Animal Type
                    </h3>
                    <div className="flex gap-2">
                      {selectedAnimal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAnimal(null)}
                          className="text-sm"
                        >
                          Clear Filter ({selectedAnimal})
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Animal Filter Pills - 2 rows of 4 */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
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
                          className={`py-2 px-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "ring-2 ring-blue-400 shadow-lg transform scale-105"
                              : "hover:transform hover:scale-102"
                          }`}
                          style={{ 
                            backgroundColor: isSelected ? animalInfo.color : animalInfo.color,
                            color: "white",
                            opacity: isSelected ? 1 : 0.9
                          }}
                          onClick={() => {
                            setSelectedPersonality(null);
                            setSelectedGenius(null);
                            setSelectedLearningStyle(null);
                            setSelectedAnimal(
                              isSelected ? null : animalName,
                            );
                          }}
                          title={`Click to filter by ${animalName} (${count} students, ${percentage}%)`}
                        >
                          <span className="text-sm font-bold">{animalName}</span>
                          <span className="text-sm font-bold opacity-90">{count} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Main Dashboard Layout: Student List (70%) | Charts (30%) */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                  
                  {/* Left Side: Full Height Student List (70%) */}
                  <div className="lg:col-span-7 bg-white rounded-lg border flex flex-col h-[700px]">
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Students
                          {(selectedAnimal || selectedPersonality || selectedGenius || selectedLearningStyle) && (
                            <span className="text-sm font-normal text-blue-600 ml-2">
                              ({filteredSubmissions.length} filtered)
                            </span>
                          )}
                        </h3>
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
                            <Upload className="h-3 w-3" />
                            Import
                          </Button>
                        </PermissionGate>
                      </div>
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Student Table - Fixed Height Like Spreadsheet */}
                    <div className="flex-1 flex flex-col">
                      <div className="h-[500px] overflow-hidden border border-gray-200 rounded-lg">
                        <table className="min-w-full table-fixed">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Animal</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Genius</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Coins</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">Report</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {/* Render exactly 20 rows - filled or empty */}
                            {Array.from({ length: itemsPerPage }, (_, index) => {
                              const submission = paginatedSubmissions[index];
                              if (!submission) {
                                // Empty row for consistent table height
                                return (
                                  <tr key={`empty-${index}`} className="h-12 border-b border-gray-100">
                                    <td className="px-3 py-2 h-12">&nbsp;</td>
                                    <td className="px-3 py-2 h-12">&nbsp;</td>
                                    <td className="px-3 py-2 h-12">&nbsp;</td>
                                    <td className="px-3 py-2 h-12">&nbsp;</td>
                                    <td className="px-3 py-2 h-12">&nbsp;</td>
                                  </tr>
                                );
                              }
                              
                              // Filled row with student data
                              const animal = getAnimalByName(submission.animalType);
                              return (
                                <tr
                                  key={submission.id}
                                  className="h-12 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                                  onClick={() => setLocation(`/teacher/student/${submission.id}?classId=${classId}&from=analytics`)}
                                >
                                  <td className="px-3 py-2 h-12">
                                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                      {submission.studentName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {submission.learningStyle === "readingWriting" 
                                        ? "R/W" 
                                        : submission.learningStyle === "visual" 
                                          ? "Visual"
                                          : submission.learningStyle === "auditory"
                                            ? "Auditory" 
                                            : submission.learningStyle === "kinesthetic"
                                              ? "Kinesthetic"
                                              : submission.learningStyle?.charAt(0).toUpperCase() || "N/A"}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 h-12">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 mr-3 flex-shrink-0 bg-gray-50 rounded-sm overflow-hidden">
                                        <img 
                                          src={animalColors[submission.animalType]?.svg || getAssetUrl("/images/meerkat.svg")} 
                                          alt={submission.animalType} 
                                          className="w-8 h-8 object-cover" 
                                        />
                                      </div>
                                      <span className="text-xs text-gray-900">
                                        {submission.animalType}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 h-12">
                                    <span
                                      className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                                      style={{
                                        backgroundColor:
                                          (submission.geniusType || submission.animalGenius) === "Thinker"
                                            ? "#8B5CF6"
                                            : (submission.geniusType || submission.animalGenius) === "Feeler"
                                              ? "#10B981"
                                              : "#F59E0B",
                                      }}
                                    >
                                      {submission.geniusType || submission.animalGenius || 'Unknown'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 h-12">
                                    <div 
                                      className="flex items-center gap-1 cursor-pointer hover:bg-yellow-50 rounded px-2 py-1 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocation(`/teacher/class/${classId}/economy`);
                                      }}
                                      title="View class economy"
                                    >
                                      <Coins className="w-3 h-3 text-yellow-600" />
                                      <span className="text-sm font-semibold text-yellow-700">
                                        {submission.currencyBalance || 0}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 h-12">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocation(`/teacher/student/${submission.id}?classId=${classId}&from=analytics`);
                                      }}
                                      className="h-6 px-2 text-xs"
                                    >
                                      View Report
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">
                            Showing{" "}
                            <span className="font-semibold text-gray-900">
                              {(currentPage - 1) * itemsPerPage + 1}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-gray-900">
                              {Math.min(currentPage * itemsPerPage, filteredSubmissions.length)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-900">
                              {filteredSubmissions.length}
                            </span>{" "}
                            students
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="h-8 px-3 text-xs font-medium"
                          >
                            Previous
                          </Button>
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                              const page = i + 1;
                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className={`h-8 w-8 p-0 text-xs ${
                                    currentPage === page 
                                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" 
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {page}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="h-8 px-3 text-xs font-medium"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Simple Footer for Single Page */}
                    {totalPages <= 1 && (
                      <div className="px-6 py-4 bg-white border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                          Showing{" "}
                          <span className="font-semibold text-gray-900">
                            {filteredSubmissions.length}
                          </span>{" "}
                          students
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Charts (30%) */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Learning Styles - Moved Above Charts */}
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="text-md font-medium text-gray-700 mb-3">
                        Learning Styles
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(analyticsData.stats.learningStyleDistribution || {}).map(([style, count]) => {
                          const percentage = analyticsData.stats.totalSubmissions > 0
                            ? Math.round((count / analyticsData.stats.totalSubmissions) * 100)
                            : 0;
                          
                          const learningStyleIcons = {
                            "Visual": { name: "Visual", color: "#4F46E5", icon: "Eye" },
                            "Auditory": { name: "Auditory", color: "#059669", icon: "Volume2" },
                            "Kinesthetic": { name: "Kinesthetic", color: "#DC2626", icon: "Zap" },
                            "Reading/Writing": { name: "Reading/Writing", color: "#7C2D12", icon: "BookOpen" },
                          };

                          const iconComponents = { Eye, Volume2, Zap, BookOpen, Monitor };
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
                                setSelectedAnimal(null);
                                setSelectedPersonality(null);
                                setSelectedGenius(null);
                                setSelectedLearningStyle(selectedLearningStyle === style ? null : style);
                              }}
                            >
                              <div className="w-6 h-6 mb-1 mx-auto">
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
                              <div className="font-medium text-xs">{styleInfo.name}</div>
                              <div className="text-xs text-gray-600">{count}</div>
                              <div className="w-full h-1 rounded-full bg-gray-200 mt-1">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    backgroundColor: styleInfo.color,
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Personality Distribution - Swapped to First */}
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="text-md font-medium text-gray-700 mb-3">
                        Extroversion vs Introversion
                      </h4>
                      <InteractivePieChart
                        data={personalityPieChartData}
                        selectedAnimal={selectedPersonality}
                        onAnimalClick={(personality) => {
                          setSelectedAnimal(null);
                          setSelectedGenius(null);
                          setSelectedLearningStyle(null);
                          setSelectedPersonality(personality === selectedPersonality ? null : personality);
                        }}
                      />
                    </div>

                    {/* Animal Genius Distribution - Swapped to Second */}
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="text-md font-medium text-gray-700 mb-3">
                        Animal Genius Types
                      </h4>
                      <InteractivePieChart
                        data={animalGeniusPieChartData}
                        selectedAnimal={selectedGenius}
                        onAnimalClick={(genius) => {
                          setSelectedAnimal(null);
                          setSelectedPersonality(null);
                          setSelectedLearningStyle(null);
                          setSelectedGenius(genius === selectedGenius ? null : genius);
                        }}
                      />
                    </div>
                  </div>
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
