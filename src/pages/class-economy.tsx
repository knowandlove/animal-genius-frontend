import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getIconComponent, getIconColor } from "@/utils/icon-utils";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MiniAvatar } from "@/components/mini-avatar/MiniAvatar";
import { format } from "date-fns";
import { 
  Coins, 
  Plus, 
  Minus, 
  Store, 
  Users, 
  Filter,
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  History,
  Gift,
  Trophy,
  ShoppingCart,
  Check,
  X,
  Clock
} from "lucide-react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Student {
  id: number;
  studentName: string;
  gradeLevel: string;
  animalType: string;
  animalGenius: string;
  currencyBalance: number;
  passportCode: string;
  completedAt: string;
  avatarData?: {
    equipped?: {
      hat?: string;
      glasses?: string;
      accessory?: string;
    };
  };
}

interface ClassEconomyData {
  class: {
    id: number;
    name: string;
    code: string;
    teacherId: number;
    iconEmoji?: string;
    iconColor?: string;
    icon?: string; // Backend returns this instead of iconEmoji
    backgroundColor?: string; // Backend returns this instead of iconColor
  };
  students: Student[];
}

interface Transaction {
  id: number;
  amount: number;
  reason: string;
  transactionType: string;
  createdAt: string;
  teacher?: {
    firstName: string;
    lastName: string;
  };
}

export default function ClassEconomy() {
  const { classId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [filterAnimal, setFilterAnimal] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "balance" | "animal">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authTokenChanged"));
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
    setLocation("/");
  };

  // Get class data and students
  const { data: economyData, isLoading, error } = useQuery({
    queryKey: [`/api/classes/${classId}/economy`],
    queryFn: async () => {
      const data = await apiRequest('GET', `/api/classes/${classId}/analytics`);
      return {
        class: data.class,
        students: data.submissions || []
      };
    },
    enabled: !!classId,
  });

  // Get store status
  const { data: storeStatus } = useQuery({
    queryKey: [`/api/classes/${economyData?.class?.id}/store-status`],
    queryFn: () => {
      const classUuid = economyData?.class?.id;
      if (!classUuid) return null;
      return apiRequest('GET', `/api/classes/${classUuid}/store-status`);
    },
    enabled: !!economyData?.class?.id,
  });

  // Get transaction history for selected student
  const { data: transactionHistory, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: [`/api/currency/history/${selectedStudentId}`],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      console.log('Fetching transaction history for student:', selectedStudentId);
      try {
        const result = await apiRequest('GET', `/api/currency/history/${selectedStudentId}`);
        console.log('Transaction history result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        throw error;
      }
    },
    enabled: !!selectedStudentId && transactionHistoryOpen,
  });

  // Toggle store mutation
  const toggleStoreMutation = useMutation({
    mutationFn: async (isOpen: boolean) => {
      // Use the UUID from economyData, not the numeric classId from URL
      const classUuid = economyData?.class?.id;
      if (!classUuid) {
        throw new Error('Class UUID not found');
      }
      return apiRequest('POST', '/api/currency/store/toggle', {
        classId: classUuid,
        isOpen
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: storeStatus?.isOpen ? "Store closed successfully" : "Store opened successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/classes/${economyData?.class?.id}/store-status`],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle store status",
        variant: "destructive",
      });
    },
  });

  const toggleStore = (isOpen: boolean) => {
    toggleStoreMutation.mutate(isOpen);
  };

  // Currency mutations
  const currencyMutation = useMutation({
    mutationFn: async ({ action, studentIds, amount, reason }: {
      action: 'give' | 'take';
      studentIds: number[];
      amount: number;
      reason: string;
    }) => {
      const promises = studentIds.map(studentId => 
        apiRequest('POST', `/api/currency/${action}`, {
          studentId: studentId,
          amount,
          reason
        })
      );
      return Promise.all(promises);
    },
    onSuccess: (data) => {
      const count = Array.isArray(data) ? data.length : 1;
      toast({
        title: "Success",
        description: `Updated currency for ${count} student${count > 1 ? 's' : ''}`,
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/classes/${classId}/economy`],
      });
      setSelectedStudents(new Set());
      setBulkAmount("");
      setBulkReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update currency",
        variant: "destructive",
      });
    },
  });

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    if (!economyData?.students) return [];
    
    let filtered = economyData.students.filter(student => {
      const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAnimal = filterAnimal === "all" || student.animalType === filterAnimal;
      return matchesSearch && matchesAnimal;
    });

    // Sort students
    filtered.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case "name":
          compareValue = a.studentName.localeCompare(b.studentName);
          break;
        case "balance":
          compareValue = (a.currencyBalance || 0) - (b.currencyBalance || 0);
          break;
        case "animal":
          compareValue = a.animalType.localeCompare(b.animalType);
          break;
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [economyData?.students, searchTerm, filterAnimal, sortBy, sortOrder]);

  // Get unique animal types for filter
  const animalTypes = useMemo(() => {
    if (!economyData?.students) return [];
    const types = [...new Set(economyData.students.map(s => s.animalType))];
    return types.sort();
  }, [economyData?.students]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!economyData?.students) return { total: 0, average: 0, highest: 0, lowest: 0 };
    
    const balances = economyData.students.map(s => s.currencyBalance || 0);
    return {
      total: balances.reduce((sum, b) => sum + b, 0),
      average: balances.length > 0 ? Math.round(balances.reduce((sum, b) => sum + b, 0) / balances.length) : 0,
      highest: Math.max(...balances, 0),
      lowest: Math.min(...balances, 0)
    };
  }, [economyData?.students]);

  // Quick action handlers
  const handleQuickGive = (studentId: number, amount: number, reason: string) => {
    currencyMutation.mutate({
      action: 'give',
      studentIds: [studentId],
      amount,
      reason
    });
  };

  const handleBulkAction = (action: 'give' | 'take') => {
    if (selectedStudents.size === 0 || !bulkAmount || !bulkReason) return;
    
    currencyMutation.mutate({
      action,
      studentIds: Array.from(selectedStudents),
      amount: parseInt(bulkAmount),
      reason: bulkReason
    });
  };

  const toggleStudentSelection = (studentId: number) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleSort = (column: "name" | "balance" | "animal") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleViewHistory = (studentId: number) => {
    console.log('Opening transaction history for student:', studentId);
    setSelectedStudentId(studentId);
    setTransactionHistoryOpen(true);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'teacher_gift':
        return <Gift className="w-4 h-4" />;
      case 'quiz_complete':
        return <Trophy className="w-4 h-4" />;
      case 'achievement':
        return <Trophy className="w-4 h-4" />;
      case 'purchase':
        return <ShoppingCart className="w-4 h-4" />;
      default:
        return <Coins className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? "text-green-600" : "text-red-600";
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        className={undefined}
        classCode={undefined}
        user={user || undefined}
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
          <span className="ml-2">Loading class economy...</span>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !economyData) {
    return (
      <AuthenticatedLayout 
        showSidebar={true}
        classId={classId}
        user={user || undefined}
        onLogout={handleLogout}
      >
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Class Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load class economy data.
            </p>
            <Button onClick={() => setLocation("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout 
      showSidebar={true}
      classId={classId}
      className={economyData.class?.name}
      classCode={economyData.class?.code}
      user={user || undefined}
      onLogout={handleLogout}
    >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: getIconColor(economyData.class.iconColor, economyData.class.backgroundColor) }}
              >
                {(() => {
                  const IconComponent = getIconComponent(economyData.class.icon || economyData.class.iconEmoji);
                  return <IconComponent className="w-6 h-6 text-white" />;
                })()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {economyData.class.name} - Class Economy
                </h1>
                <p className="text-muted-foreground">
                  Manage student currency and store settings
                </p>
              </div>
            </div>
          </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Coins</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">{stats.average}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Highest</p>
                  <p className="text-2xl font-bold">{stats.highest}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold">{economyData.students.length}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="currency" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="currency" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Student Currency
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Store Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="currency" className="space-y-4">
            {/* Filters and Bulk Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search and Filter */}
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterAnimal} onValueChange={setFilterAnimal}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Animals</SelectItem>
                        {animalTypes.map(animal => (
                          <SelectItem key={animal as string} value={animal as string}>
                            {animal as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bulk Actions */}
                  {selectedStudents.size > 0 && (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={bulkAmount}
                        onChange={(e) => setBulkAmount(e.target.value)}
                        className="w-24"
                      />
                      <Input
                        placeholder="Reason"
                        value={bulkReason}
                        onChange={(e) => setBulkReason(e.target.value)}
                        className="w-40"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleBulkAction('give')}
                        disabled={!bulkAmount || !bulkReason || currencyMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                        Give
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleBulkAction('take')}
                        disabled={!bulkAmount || !bulkReason || currencyMutation.isPending}
                        variant="destructive"
                      >
                        <Minus className="w-4 h-4" />
                        Take
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        ({selectedStudents.size} selected)
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">
                          <Checkbox
                            checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                            onCheckedChange={toggleAllSelection}
                          />
                        </th>
                        <th 
                          className="p-3 text-left cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            Student
                            {sortBy === "name" && (
                              <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-3 text-left cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("animal")}
                        >
                          <div className="flex items-center gap-1">
                            Animal
                            {sortBy === "animal" && (
                              <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th className="p-3 text-left">Passport</th>
                        <th 
                          className="p-3 text-center cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("balance")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Balance
                            {sortBy === "balance" && (
                              <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th className="p-3 text-center">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            {searchTerm || filterAnimal !== "all" 
                              ? "No students match your filters" 
                              : "No students found"}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <Checkbox
                                checked={selectedStudents.has(student.id)}
                                onCheckedChange={() => toggleStudentSelection(student.id)}
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <MiniAvatar 
                                  animalType={student.animalType} 
                                  equipped={student.avatarData?.equipped}
                                  size={40}
                                />
                                <div>
                                  <div className="font-medium">{student.studentName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Grade {student.gradeLevel}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">
                                {student.animalType}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {student.passportCode}
                              </code>
                            </td>
                            <td className="p-3">
                              <div 
                                className="flex items-center justify-center gap-1 cursor-pointer hover:bg-yellow-50 rounded px-2 py-1 transition-colors"
                                onClick={() => handleViewHistory(student.id)}
                                title="Click to view transaction history"
                              >
                                <Coins className="w-4 h-4 text-yellow-600" />
                                <span className="font-bold text-lg text-yellow-700 hover:text-yellow-800">
                                  {student.currencyBalance || 0}
                                </span>
                                <History className="w-3 h-3 text-gray-400 ml-1" />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuickGive(student.id, 5, "Quick bonus (+5)")}
                                  disabled={currencyMutation.isPending}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  +5
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuickGive(student.id, 10, "Quick bonus (+10)")}
                                  disabled={currencyMutation.isPending}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  +10
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuickGive(student.id, 25, "Quick bonus (+25)")}
                                  disabled={currencyMutation.isPending}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  +25
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store" className="space-y-6">
            {/* Store Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">Store Status</h3>
                    <p className="text-sm text-muted-foreground">
                      Control when students can access the store
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {storeStatus?.isOpen ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        Open
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <X className="w-3 h-3 mr-1" />
                        Closed
                      </Badge>
                    )}
                    <Button
                      onClick={() => toggleStore(!storeStatus?.isOpen)}
                      disabled={toggleStoreMutation.isPending}
                      variant={storeStatus?.isOpen ? "destructive" : "default"}
                    >
                      {toggleStoreMutation.isPending ? (
                        <LoadingSpinner className="w-4 h-4" />
                      ) : storeStatus?.isOpen ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Close Store
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Open Store
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Store Information */}
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Direct Purchase System</p>
                    <p className="text-sm text-muted-foreground">
                      Students can buy items instantly with their coins. No approval needed.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">How it works:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Open or close the store anytime</li>
                      <li>• Students can only shop when store is open</li>
                      <li>• Purchases are instant (no approval needed)</li>
                      <li>• Track all purchases in transaction history</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Benefits:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Control when students can shop</li>
                      <li>• Create special shopping events</li>
                      <li>• No approval queue to manage</li>
                      <li>• Students get items instantly</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Transaction History Modal */}
      <Dialog open={transactionHistoryOpen} onOpenChange={setTransactionHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Transaction History
              {selectedStudentId && economyData && (
                <span className="text-muted-foreground font-normal">
                  - {economyData.students.find(s => s.id === selectedStudentId)?.studentName}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2">Loading transaction history...</span>
              </div>
            ) : transactionHistory && transactionHistory.length > 0 ? (
              <div className="space-y-2">
                {transactionHistory.map((transaction: any) => (
                  <div key={transaction.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.transactionType)}
                        <span className="font-medium">{transaction.description}</span>
                      </div>
                      <span className={`font-bold ${getTransactionColor(transaction.amount)}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No transaction history available
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}