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
import Header from "@/components/header";
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

interface PurchaseRequest {
  id: number;
  studentId: number;
  studentName: string;
  studentBalance: number;
  passportCode: string;
  animalType: string;
  itemType: string;
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemRarity: string;
  cost: number;
  status: string;
  requestedAt: string;
  balanceAfterPurchase: number;
  avatarData?: {
    equipped?: {
      hat?: string;
      glasses?: string;
      accessory?: string;
    };
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

  // Get purchase requests for the class
  const { data: purchaseRequests, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: [`/api/classes/${classId}/purchase-requests`],
    queryFn: async () => {
      return await apiRequest('GET', `/api/classes/${classId}/purchase-requests`);
    },
    enabled: !!classId,
    refetchInterval: 5000, // Poll every 5 seconds for new requests
    refetchIntervalInBackground: true, // Keep polling even when tab is not focused
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
          submissionId: studentId,
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

  // Store toggle mutation
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

  // Purchase request approval/denial mutation
  const processPurchaseMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: 'approve' | 'deny' }) => {
      return await apiRequest('POST', '/api/purchase-requests/process', {
        requestId,
        action
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      refetchRequests();
      queryClient.invalidateQueries({
        queryKey: [`/api/classes/${classId}/economy`],
      });
      // Also invalidate all student island caches to force refresh
      queryClient.invalidateQueries({
        queryKey: [`/api/island-page-data/`],
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    },
  });

  // Bulk approve all requests
  const bulkProcessMutation = useMutation({
    mutationFn: async (action: 'approve' | 'deny') => {
      const requestIds = purchaseRequests?.map((r: PurchaseRequest) => r.id) || [];
      return await apiRequest('POST', '/api/purchase-requests/bulk-process', {
        requestIds,
        action
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      refetchRequests();
      queryClient.invalidateQueries({
        queryKey: [`/api/classes/${classId}/economy`],
      });
      // Also invalidate all student island caches to force refresh
      queryClient.invalidateQueries({
        queryKey: [`/api/island-page-data/`],
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process requests",
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
      <div className="min-h-screen">
        <Header isAuthenticated={true} user={user || undefined} onLogout={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2">Loading class economy...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !economyData) {
    return (
      <div className="min-h-screen">
        <Header isAuthenticated={true} user={user || undefined} onLogout={() => {}} />
        <div className="container mx-auto px-4 py-8">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAuthenticated={true} user={user || undefined} onLogout={() => {}} />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation(`/classes/${classId}/analytics`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Analytics
            </Button>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: economyData.class.iconColor || "hsl(202 25% 65%)" }}
              >
                {economyData.class.iconEmoji || "📚"}
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
                          <SelectItem key={animal} value={animal}>
                            {animal}
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
            {/* Store Management Tab */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store Controls
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
                  <p className="text-sm text-muted-foreground">
                    Control when students can browse and request items from the store.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Purchase Requests
                  </span>
                  {purchaseRequests && purchaseRequests.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => bulkProcessMutation.mutate('approve')}
                        disabled={bulkProcessMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve All
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => bulkProcessMutation.mutate('deny')}
                        disabled={bulkProcessMutation.isPending}
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Deny All
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                    <span className="ml-2">Loading purchase requests...</span>
                  </div>
                ) : purchaseRequests && purchaseRequests.length > 0 ? (
                  <div className="space-y-3">
                    {purchaseRequests.map((request: PurchaseRequest) => (
                      <Card key={request.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <MiniAvatar 
                              animalType={request.animalType} 
                              equipped={request.avatarData?.equipped}
                              size={40}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{request.studentName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {request.animalType}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-muted-foreground mb-2">
                                Wants to buy: <span className="font-medium text-foreground">{request.itemName}</span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Coins className="w-3 h-3 text-yellow-600" />
                                  <span>Cost: {request.cost}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Balance:</span>
                                  <span className={request.balanceAfterPurchase < 0 ? "text-red-600 font-medium" : ""}>
                                    {request.studentBalance} → {request.balanceAfterPurchase}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{format(new Date(request.requestedAt), "MMM d 'at' h:mm a")}</span>
                                </div>
                              </div>
                              
                              {request.itemRarity && (
                                <Badge 
                                  variant={request.itemRarity === 'rare' ? 'default' : 'secondary'}
                                  className="mt-2 text-xs"
                                >
                                  {request.itemRarity}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => processPurchaseMutation.mutate({ 
                                requestId: request.id, 
                                action: 'approve' 
                              })}
                              disabled={processPurchaseMutation.isPending || request.balanceAfterPurchase < 0}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => processPurchaseMutation.mutate({ 
                                requestId: request.id, 
                                action: 'deny' 
                              })}
                              disabled={processPurchaseMutation.isPending}
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                              Deny
                            </Button>
                          </div>
                        </div>
                        
                        {request.balanceAfterPurchase < 0 && (
                          <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-600">
                            ⚠️ Student doesn't have enough coins for this purchase
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No pending purchase requests</p>
                    <p className="text-sm mt-1">Requests will appear here when students want to buy items</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
          
          {historyError ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading transaction history:</p>
              <p className="text-sm">{(historyError as Error).message}</p>
            </div>
          ) : isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2">Loading history...</span>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              {transactionHistory && transactionHistory.length > 0 ? (
                <div className="space-y-2">
                  {transactionHistory.map((transaction: Transaction) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getTransactionIcon(transaction.transactionType)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{transaction.reason || "No reason provided"}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>{format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                              {transaction.teacher && (
                                <span>by {transaction.teacher.firstName} {transaction.teacher.lastName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold text-lg ${getTransactionColor(transaction.amount)}`}>
                          {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No transaction history yet</p>
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}