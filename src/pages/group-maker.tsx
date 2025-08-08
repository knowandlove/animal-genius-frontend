import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Shuffle, Users, Printer, RotateCcw, Download, Grid3X3, Square, Rows, Move } from "lucide-react";
import { calculateResults } from "@shared/scoring";
import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { API_URL } from "@/config/api";

// Helper function to get animal image path
function getAnimalImagePath(animalType: string): string {
  const imageMap: Record<string, string> = {
    'Elephant': '/images/elephant.png',
    'Owl': '/images/owl.png',
    'Otter': '/images/otter.png',
    'Parrot': '/images/parrot.png',
    'Border Collie': '/images/collie.png',
    'Panda': '/images/panda.png',
    'Meerkat': '/images/meerkat.svg',
    'Beaver': '/images/beaver.svg'
  };
  return imageMap[animalType] || '/images/kal-character.png';
}

interface Student {
  id: number;
  studentName: string;
  animalGenius: "Thinker" | "Feeler" | "Doer";
  mbtiType?: string;
  animalType: string;
  answers: Array<{questionId: number; answer: 'A' | 'B'}>;
  [key: string]: any;
}

interface ClassData {
  id: number;
  name: string;
  code: string;
  submissionCount: number;
}

interface Group {
  id: number;
  students: Student[];
}

interface SeatingPosition {
  id: string;
  student: Student | null;
  tableId?: string;
}

interface SeatingTable {
  id: string;
  seats: SeatingPosition[];
  position: { row: number; col: number };
}

type LayoutType = "tables4" | "tables6" | "rows" | "ushape" | "groups3";
type SeatingStrategy = "energyBalance" | "geniusBalance" | "random" | "smartMix";
type Mode = "groups" | "seating";

export default function GroupMaker() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedClassId = urlParams.get('classId') || "";
  const fromAnalytics = urlParams.get('from') === 'analytics';
  const urlMode = urlParams.get('mode') as Mode | null;
  
  // Determine if we're in class-specific mode
  const isClassSpecific = preselectedClassId && preselectedClassId !== "";
  
  const [selectedClassId, setSelectedClassId] = useState<string>(preselectedClassId);
  const [mode, setMode] = useState<Mode>(urlMode || "groups");
  const [groupSize, setGroupSize] = useState<number>(3);
  const [balanceBy, setBalanceBy] = useState<"random" | "animalGenius" | "energyLevel">("random");
  const [groups, setGroups] = useState<Group[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Seating Chart states
  const [layoutType, setLayoutType] = useState<LayoutType>("tables4");
  const [seatingStrategy, setSeatingStrategy] = useState<SeatingStrategy>("energyBalance");
  const [seatingArrangement, setSeatingArrangement] = useState<SeatingTable[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [showSeatingResults, setShowSeatingResults] = useState(false);
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  // Fetch teacher's classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch classes");
      return response.json();
    },
    enabled: !!user && !!localStorage.getItem("authToken"),
  });

  // Fetch students for selected class
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/classes", selectedClassId, "analytics"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/classes/${selectedClassId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
    enabled: !!selectedClassId && !!user,
  });

  const students: Student[] = studentsData?.submissions || [];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authTokenChanged"));
    setLocation("/");
  };

  const generateGroups = () => {
    if (students.length === 0) {
      toast({
        title: "No Students",
        description: "Please select a class with students who have completed the quiz.",
        variant: "destructive",
      });
      return;
    }

    // Calculate MBTI types for students who don't have them
    const studentsWithMBTI = students.map(student => {
      if (!student.mbtiType && student.answers) {
        const results = calculateResults(student.answers);
        return {
          ...student,
          mbtiType: results.mbtiType
        };
      }
      return student;
    });
    
    let shuffledStudents = [...studentsWithMBTI];
    
    if (balanceBy === "random") {
      // Simple random shuffle
      shuffledStudents = shuffledStudents.sort(() => Math.random() - 0.5);
    } else if (balanceBy === "animalGenius") {
      // Balance by Animal Genius types
      const thinkers = studentsWithMBTI.filter((s: Student) => s.animalGenius === "Thinker");
      const feelers = studentsWithMBTI.filter((s: Student) => s.animalGenius === "Feeler");
      const doers = studentsWithMBTI.filter((s: Student) => s.animalGenius === "Doer");
      
      shuffledStudents = [];
      const maxLength = Math.max(thinkers.length, feelers.length, doers.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (thinkers[i]) shuffledStudents.push(thinkers[i]);
        if (feelers[i]) shuffledStudents.push(feelers[i]);
        if (doers[i]) shuffledStudents.push(doers[i]);
      }
    } else if (balanceBy === "energyLevel") {
      // Balance by Introvert/Extrovert
      const introverts = studentsWithMBTI.filter((s: Student) => s.mbtiType && s.mbtiType.startsWith("I"));
      const extroverts = studentsWithMBTI.filter((s: Student) => s.mbtiType && s.mbtiType.startsWith("E"));
      
      shuffledStudents = [];
      const maxLength = Math.max(introverts.length, extroverts.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (introverts[i]) shuffledStudents.push(introverts[i]);
        if (extroverts[i]) shuffledStudents.push(extroverts[i]);
      }
    }

    // Create groups
    const newGroups: Group[] = [];
    for (let i = 0; i < shuffledStudents.length; i += groupSize) {
      newGroups.push({
        id: Math.floor(i / groupSize) + 1,
        students: shuffledStudents.slice(i, i + groupSize),
      });
    }

    setGroups(newGroups);
    setShowResults(true);
  };

  const shuffleGroups = () => {
    generateGroups();
  };

  const handlePrint = () => {
    window.print();
  };

  const getTraitLabel = (student: Student) => {
    if (balanceBy === "animalGenius") {
      return student.animalGenius;
    } else if (balanceBy === "energyLevel") {
      return student.mbtiType && student.mbtiType.startsWith("I") ? "Introvert" : "Extrovert";
    }
    return "";
  };

  const getTraitColor = (trait: string) => {
    switch (trait) {
      case "Thinker": return "bg-blue-100 text-blue-800";
      case "Feeler": return "bg-pink-100 text-pink-800";
      case "Doer": return "bg-orange-100 text-orange-800";
      case "Introvert": return "bg-purple-100 text-purple-800";
      case "Extrovert": return "bg-primary/20 text-primary";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Seating Chart Functions
  const createSeatingLayout = (layoutType: LayoutType, numStudents: number): SeatingTable[] => {
    const tables: SeatingTable[] = [];
    
    switch (layoutType) {
      case "tables4": {
        const numTables = Math.ceil(numStudents / 4);
        for (let i = 0; i < numTables; i++) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          tables.push({
            id: `table-${i + 1}`,
            position: { row, col },
            seats: [
              { id: `${i}-0`, student: null, tableId: `table-${i + 1}` },
              { id: `${i}-1`, student: null, tableId: `table-${i + 1}` },
              { id: `${i}-2`, student: null, tableId: `table-${i + 1}` },
              { id: `${i}-3`, student: null, tableId: `table-${i + 1}` }
            ]
          });
        }
        break;
      }
      case "tables6": {
        const numTables = Math.ceil(numStudents / 6);
        for (let i = 0; i < numTables; i++) {
          const row = Math.floor(i / 2);
          const col = i % 2;
          tables.push({
            id: `table-${i + 1}`,
            position: { row, col },
            seats: [
              { id: `${i}-0`, student: null, tableId: `table-${i + 1}` },
              { id: `${i}-1`, student: null, tableId: `table-${i + 1}` },
              { id: `${i}-2`, student: null, tableId: `table-${i + 1}` },
              { id: `${i}-3`, student: null, tableId: `table-${i + 1}` },
              { id: `${i}-4`, student: null, tableId: `table-${i + 1}` },
              { id: `${i}-5`, student: null, tableId: `table-${i + 1}` }
            ]
          });
        }
        break;
      }
      case "rows": {
        const numRows = Math.ceil(numStudents / 4);
        for (let row = 0; row < numRows; row++) {
          tables.push({
            id: `row-${row + 1}`,
            position: { row, col: 0 },
            seats: [
              { id: `${row}-0`, student: null, tableId: `row-${row + 1}` },
              { id: `${row}-1`, student: null, tableId: `row-${row + 1}` },
              { id: `${row}-2`, student: null, tableId: `row-${row + 1}` },
              { id: `${row}-3`, student: null, tableId: `row-${row + 1}` }
            ]
          });
        }
        break;
      }
      case "groups3": {
        const numTables = Math.ceil(numStudents / 3);
        for (let i = 0; i < numTables; i++) {
          const row = Math.floor(i / 4);
          const col = i % 4;
          tables.push({
            id: `group-${i + 1}`,
            position: { row, col },
            seats: [
              { id: `${i}-0`, student: null, tableId: `group-${i + 1}` },
              { id: `${i}-1`, student: null, tableId: `group-${i + 1}` },
              { id: `${i}-2`, student: null, tableId: `group-${i + 1}` }
            ]
          });
        }
        break;
      }
      case "ushape": {
        // Create U-shape arrangement
        const leftSide = Math.ceil(numStudents / 3);
        const rightSide = Math.ceil(numStudents / 3);
        const bottom = numStudents - leftSide - rightSide;
        
        // Left side
        for (let i = 0; i < leftSide; i += 2) {
          tables.push({
            id: `left-${Math.floor(i/2) + 1}`,
            position: { row: Math.floor(i/2), col: 0 },
            seats: [
              { id: `left-${i}`, student: null, tableId: `left-${Math.floor(i/2) + 1}` },
              { id: `left-${i+1}`, student: null, tableId: `left-${Math.floor(i/2) + 1}` }
            ]
          });
        }
        // Right side
        for (let i = 0; i < rightSide; i += 2) {
          tables.push({
            id: `right-${Math.floor(i/2) + 1}`,
            position: { row: Math.floor(i/2), col: 4 },
            seats: [
              { id: `right-${i}`, student: null, tableId: `right-${Math.floor(i/2) + 1}` },
              { id: `right-${i+1}`, student: null, tableId: `right-${Math.floor(i/2) + 1}` }
            ]
          });
        }
        // Bottom
        if (bottom > 0) {
          tables.push({
            id: 'bottom-1',
            position: { row: 3, col: 2 },
            seats: Array.from({ length: Math.min(bottom, 4) }, (_, i) => ({
              id: `bottom-${i}`,
              student: null,
              tableId: 'bottom-1'
            }))
          });
        }
        break;
      }
    }
    
    return tables;
  };

  const assignStudentsToSeats = (
    tables: SeatingTable[], 
    students: Student[], 
    strategy: SeatingStrategy
  ): { tables: SeatingTable[]; unassigned: Student[] } => {
    const studentsWithMBTI = students.map(student => {
      if (!student.mbtiType && student.answers) {
        const results = calculateResults(student.answers);
        return { ...student, mbtiType: results.mbtiType };
      }
      return student;
    });

    let orderedStudents = [...studentsWithMBTI];
    
    if (strategy === "energyBalance") {
      const introverts = studentsWithMBTI.filter(s => s.mbtiType?.startsWith("I"));
      const extroverts = studentsWithMBTI.filter(s => s.mbtiType?.startsWith("E"));
      orderedStudents = [];
      const maxLength = Math.max(introverts.length, extroverts.length);
      for (let i = 0; i < maxLength; i++) {
        if (extroverts[i]) orderedStudents.push(extroverts[i]);
        if (introverts[i]) orderedStudents.push(introverts[i]);
      }
    } else if (strategy === "geniusBalance") {
      const thinkers = studentsWithMBTI.filter(s => s.animalGenius === "Thinker");
      const feelers = studentsWithMBTI.filter(s => s.animalGenius === "Feeler");
      const doers = studentsWithMBTI.filter(s => s.animalGenius === "Doer");
      orderedStudents = [];
      const maxLength = Math.max(thinkers.length, feelers.length, doers.length);
      for (let i = 0; i < maxLength; i++) {
        if (thinkers[i]) orderedStudents.push(thinkers[i]);
        if (feelers[i]) orderedStudents.push(feelers[i]);
        if (doers[i]) orderedStudents.push(doers[i]);
      }
    } else if (strategy === "smartMix") {
      // Prioritize energy balance, then genius balance
      const introverts = studentsWithMBTI.filter(s => s.mbtiType?.startsWith("I"));
      const extroverts = studentsWithMBTI.filter(s => s.mbtiType?.startsWith("E"));
      
      const balanceByGenius = (students: Student[]) => {
        const thinkers = students.filter(s => s.animalGenius === "Thinker");
        const feelers = students.filter(s => s.animalGenius === "Feeler");
        const doers = students.filter(s => s.animalGenius === "Doer");
        const result = [];
        const maxLength = Math.max(thinkers.length, feelers.length, doers.length);
        for (let i = 0; i < maxLength; i++) {
          if (thinkers[i]) result.push(thinkers[i]);
          if (feelers[i]) result.push(feelers[i]);
          if (doers[i]) result.push(doers[i]);
        }
        return result;
      };
      
      const balancedIntroverts = balanceByGenius(introverts);
      const balancedExtroverts = balanceByGenius(extroverts);
      
      orderedStudents = [];
      const maxLength = Math.max(balancedIntroverts.length, balancedExtroverts.length);
      for (let i = 0; i < maxLength; i++) {
        if (balancedExtroverts[i]) orderedStudents.push(balancedExtroverts[i]);
        if (balancedIntroverts[i]) orderedStudents.push(balancedIntroverts[i]);
      }
    } else {
      // Random
      orderedStudents = orderedStudents.sort(() => Math.random() - 0.5);
    }

    const newTables = tables.map(table => ({ ...table, seats: [...table.seats] }));
    let studentIndex = 0;
    
    // Fill seats
    for (const table of newTables) {
      for (const seat of table.seats) {
        if (studentIndex < orderedStudents.length) {
          seat.student = orderedStudents[studentIndex];
          studentIndex++;
        }
      }
    }
    
    const unassigned = orderedStudents.slice(studentIndex);
    
    return { tables: newTables, unassigned };
  };

  const generateSeatingChart = () => {
    if (students.length === 0) {
      toast({
        title: "No Students",
        description: "Please select a class with students who have completed the quiz.",
        variant: "destructive",
      });
      return;
    }

    const layout = createSeatingLayout(layoutType, students.length);
    const { tables, unassigned } = assignStudentsToSeats(layout, students, seatingStrategy);
    
    setSeatingArrangement(tables);
    setUnassignedStudents(unassigned);
    setShowSeatingResults(true);
  };

  const swapStudents = (fromSeatId: string, toSeatId: string) => {
    const newTables = seatingArrangement.map(table => ({
      ...table,
      seats: table.seats.map(seat => ({ ...seat }))
    }));
    
    let fromSeat: SeatingPosition | null = null;
    let toSeat: SeatingPosition | null = null;
    
    for (const table of newTables) {
      for (const seat of table.seats) {
        if (seat.id === fromSeatId) fromSeat = seat;
        if (seat.id === toSeatId) toSeat = seat;
      }
    }
    
    if (fromSeat && toSeat) {
      const tempStudent = fromSeat.student;
      fromSeat.student = toSeat.student;
      toSeat.student = tempStudent;
      setSeatingArrangement(newTables);
    }
  };

  const getLayoutIcon = (layout: LayoutType) => {
    switch (layout) {
      case "tables4": return <Grid3X3 className="w-6 h-6" />;
      case "tables6": return <Square className="w-6 h-6" />;
      case "rows": return <Rows className="w-6 h-6" />;
      case "groups3": return <Users className="w-6 h-6" />;
      case "ushape": return <Move className="w-6 h-6" />;
      default: return <Grid3X3 className="w-6 h-6" />;
    }
  };

  const getLayoutName = (layout: LayoutType) => {
    switch (layout) {
      case "tables4": return "Tables of 4";
      case "tables6": return "Tables of 6";
      case "rows": return "Traditional Rows";
      case "groups3": return "Groups of 3";
      case "ushape": return "U-Shape";
      default: return "Tables of 4";
    }
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  const selectedClass = classes?.find((c: ClassData) => c.id.toString() === selectedClassId);

  return (
    <AuthenticatedLayout 
      showSidebar={!!isClassSpecific}
      classId={isClassSpecific ? preselectedClassId : undefined}
      className={selectedClass?.name}
      user={user}
      onLogout={handleLogout}
    >
      <div className="min-h-screen print:bg-white py-8 print:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <Card className="mb-8 print:mb-4">
            <CardContent className="p-6 print:p-4">
              <div className="flex items-center justify-between print:block">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">
                    {mode === "groups" ? "Group Maker" : "Seating Chart"}
                  </h1>
                  <p className="text-gray-600 print:text-sm">
                    {mode === "groups" 
                      ? "Create balanced student groups for classroom activities"
                      : "Arrange students for optimal classroom seating"
                    }
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation(fromAnalytics ? `/class/${preselectedClassId}/analytics` : "/dashboard")}
                  className="print:hidden"
                >
                  ← Back to {fromAnalytics ? "Analytics" : "Dashboard"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mode Toggle */}
          <div className="mb-6 print:hidden">
            <div className="flex bg-gray-100 rounded-lg p-1 max-w-md">
              <Button
                variant={mode === "groups" ? "default" : "ghost"}
                onClick={() => {
                  setMode("groups");
                  setShowResults(false);
                  setShowSeatingResults(false);
                }}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                Groups
              </Button>
              <Button
                variant={mode === "seating" ? "default" : "ghost"}
                onClick={() => {
                  setMode("seating");
                  setShowResults(false);
                  setShowSeatingResults(false);
                }}
                className="flex-1"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Seating
              </Button>
            </div>
          </div>

          {mode === "groups" && !showResults ? (
            /* Groups Configuration Section */
            <div className={`grid gap-8 print:hidden ${isClassSpecific ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
              {/* Class Selection */}
              {!isClassSpecific && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Class Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Class
                      </label>
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a class..." />
                        </SelectTrigger>
                        <SelectContent>
                          {classes?.map((cls: ClassData) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedClass && (
                        <div className="p-3 bg-blue-50 rounded-lg mt-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{students.length}</span> students 
                            have completed the quiz
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Class Code: {selectedClass.code}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Group Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Group Size
                    </label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5].map((size) => (
                        <Button
                          key={size}
                          variant={groupSize === size ? "default" : "outline"}
                          onClick={() => setGroupSize(size)}
                          className="flex-1"
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Balance Groups By
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="balanceBy"
                          value="random"
                          checked={balanceBy === "random"}
                          onChange={(e) => setBalanceBy(e.target.value as any)}
                          className="mr-2"
                        />
                        <span className="text-sm">Random (no balancing)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="balanceBy"
                          value="animalGenius"
                          checked={balanceBy === "animalGenius"}
                          onChange={(e) => setBalanceBy(e.target.value as any)}
                          className="mr-2"
                        />
                        <span className="text-sm">Animal Genius (mix Thinkers, Feelers, Doers)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="balanceBy"
                          value="energyLevel"
                          checked={balanceBy === "energyLevel"}
                          onChange={(e) => setBalanceBy(e.target.value as any)}
                          className="mr-2"
                        />
                        <span className="text-sm">Energy Level (mix Introverts, Extroverts)</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={generateGroups}
                    disabled={!selectedClassId || students.length === 0 || studentsLoading}
                    className="w-full"
                    size="lg"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Generate Groups
                  </Button>
                  
                  {selectedClassId && students.length === 0 && !studentsLoading && (
                    <p className="text-sm text-amber-600 mt-2">
                      No students have completed the quiz yet
                    </p>
                  )}
                  
                  {balanceBy !== "random" && students.length > 0 && (
                    <p className="text-xs text-gray-500 mt-3">
                      Groups will be balanced as much as possible. Some groups may have 
                      an extra student if numbers don't divide evenly.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : mode === "seating" && !showSeatingResults ? (
            /* Seating Configuration Section */
            <div className={`grid gap-8 print:hidden ${isClassSpecific ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
              {/* Class Selection */}
              {!isClassSpecific && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Class Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Class
                      </label>
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a class..." />
                        </SelectTrigger>
                        <SelectContent>
                          {classes?.map((cls: ClassData) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedClass && (
                        <div className="p-3 bg-blue-50 rounded-lg mt-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{students.length}</span> students 
                            have completed the quiz
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Class Code: {selectedClass.code}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Layout Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Classroom Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Choose Layout
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["tables4", "tables6", "rows", "groups3", "ushape"] as LayoutType[]).map((layout) => (
                        <Button
                          key={layout}
                          variant={layoutType === layout ? "default" : "outline"}
                          onClick={() => setLayoutType(layout)}
                          className="h-auto p-3 flex flex-col items-center gap-2"
                        >
                          {getLayoutIcon(layout)}
                          <span className="text-xs">{getLayoutName(layout)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Arrangement Strategy
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="seatingStrategy"
                          value="energyBalance"
                          checked={seatingStrategy === "energyBalance"}
                          onChange={(e) => setSeatingStrategy(e.target.value as SeatingStrategy)}
                          className="mr-2"
                        />
                        <span className="text-sm">Energy Balance (mix introverts/extroverts)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="seatingStrategy"
                          value="geniusBalance"
                          checked={seatingStrategy === "geniusBalance"}
                          onChange={(e) => setSeatingStrategy(e.target.value as SeatingStrategy)}
                          className="mr-2"
                        />
                        <span className="text-sm">Genius Balance (mix Thinker/Feeler/Doer)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="seatingStrategy"
                          value="smartMix"
                          checked={seatingStrategy === "smartMix"}
                          onChange={(e) => setSeatingStrategy(e.target.value as SeatingStrategy)}
                          className="mr-2"
                        />
                        <span className="text-sm">Smart Mix (energy + genius)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="seatingStrategy"
                          value="random"
                          checked={seatingStrategy === "random"}
                          onChange={(e) => setSeatingStrategy(e.target.value as SeatingStrategy)}
                          className="mr-2"
                        />
                        <span className="text-sm">Random Seating</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Seating Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={generateSeatingChart}
                    disabled={!selectedClassId || students.length === 0 || studentsLoading}
                    className="w-full"
                    size="lg"
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    Generate Seating Chart
                  </Button>
                  
                  {selectedClassId && students.length === 0 && !studentsLoading && (
                    <p className="text-sm text-amber-600 mt-2">
                      No students have completed the quiz yet
                    </p>
                  )}
                  
                  {seatingStrategy !== "random" && students.length > 0 && (
                    <p className="text-xs text-gray-500 mt-3">
                      Students will be arranged to optimize collaboration and balance personalities.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : mode === "groups" && showResults ? (
            /* Results Section */
            <div>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6 print:mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 print:text-xl">
                    Groups for {selectedClass?.name}
                  </h2>
                  <p className="text-gray-600 text-sm print:text-xs">
                    {groups.length} groups • Group size: {groupSize} • 
                    Balance: {balanceBy === "random" ? "Random" : 
                             balanceBy === "animalGenius" ? "Animal Genius" : "Energy Level"}
                  </p>
                </div>
                <div className="flex gap-2 print:hidden">
                  <Button variant="outline" onClick={shuffleGroups}>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Shuffle
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={() => setShowResults(false)}>
                    ← Back to Setup
                  </Button>
                  {fromAnalytics && (
                    <Button variant="outline" onClick={() => setLocation(`/class/${preselectedClassId}/analytics`)}>
                      ← Back to Analytics
                    </Button>
                  )}
                </div>
              </div>

              {/* Groups Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
                {groups.map((group) => (
                  <Card key={group.id} className="print:break-inside-avoid print:border">
                    <CardHeader className="pb-3 print:pb-2">
                      <CardTitle className="text-lg print:text-base">
                        Group {group.id}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {group.students.map((student) => {
                          const trait = getTraitLabel(student);
                          return (
                            <div key={student.id} className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 print:text-sm">
                                {student.studentName}
                              </span>
                              {trait && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTraitColor(trait)} print:text-xs`}>
                                  {trait}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Balance Note */}
              {balanceBy !== "random" && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg print:hidden">
                  <p className="text-sm text-blue-800">
                    <strong>Balance Note:</strong> Groups are balanced by {
                      balanceBy === "animalGenius" ? "Animal Genius types" : "Energy Level"
                    } as much as possible. Perfect balance may not always be achievable 
                    depending on your class composition.
                  </p>
                </div>
              )}
            </div>
          ) : mode === "seating" && showSeatingResults ? (
            /* Seating Chart Results */
            <div>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6 print:mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 print:text-xl">
                    Seating Chart for {selectedClass?.name}
                  </h2>
                  <p className="text-gray-600 text-sm print:text-xs">
                    {getLayoutName(layoutType)} • Strategy: {
                      seatingStrategy === "energyBalance" ? "Energy Balance" :
                      seatingStrategy === "geniusBalance" ? "Genius Balance" :
                      seatingStrategy === "smartMix" ? "Smart Mix" : "Random"
                    }
                  </p>
                </div>
                <div className="flex gap-2 print:hidden">
                  <Button variant="outline" onClick={generateSeatingChart}>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={() => setShowSeatingResults(false)}>
                    ← Back to Setup
                  </Button>
                  {fromAnalytics && (
                    <Button variant="outline" onClick={() => setLocation(`/class/${preselectedClassId}/analytics`)}>
                      ← Back to Analytics
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid lg:grid-cols-4 gap-6">
                {/* Seating Chart Display */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Classroom Layout</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        {/* Front of Classroom */}
                        <div className="text-center mb-6 p-2 bg-gray-100 rounded text-sm font-medium">
                          Front of Classroom
                        </div>
                        
                        {/* Seating Grid */}
                        <div className="space-y-4">
                          {layoutType === "tables4" && (
                            <div className="grid grid-cols-3 gap-4">
                              {seatingArrangement.map((table) => (
                                <div key={table.id} className="border-2 border-gray-200 rounded-lg p-3">
                                  <div className="text-xs font-medium text-gray-500 mb-2 text-center">
                                    {table.id}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {table.seats.map((seat) => (
                                      <div
                                        key={seat.id}
                                        className={`p-2 rounded border-2 border-dashed border-gray-300 min-h-[60px] flex flex-col items-center justify-center text-xs
                                          ${seat.student ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}
                                        `}
                                        onClick={() => {
                                          if (seat.student && draggedStudent) {
                                            // Swap students
                                            swapStudents(draggedStudent.id.toString(), seat.id);
                                            setDraggedStudent(null);
                                          }
                                        }}
                                      >
                                        {seat.student ? (
                                          <>
                                            <div className="font-medium truncate w-full text-center">
                                              {seat.student.studentName.split(' ')[0]}
                                            </div>
                                            <div className="flex justify-center items-center">
                                              <img 
                                                src={getAnimalImagePath(seat.student.animalType)} 
                                                alt={seat.student.animalType}
                                                className="w-6 h-6 object-contain"
                                              />
                                            </div>
                                            <div className={`px-1 py-0.5 rounded text-xs ${
                                              seatingStrategy === "energyBalance" 
                                                ? (seat.student.mbtiType?.startsWith('E') ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary')
                                                : seatingStrategy === "geniusBalance"
                                                ? getTraitColor(seat.student.animalGenius)
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                              {seatingStrategy === "energyBalance" 
                                                ? (seat.student.mbtiType?.startsWith('E') ? 'E' : 'I')
                                                : seatingStrategy === "geniusBalance"
                                                ? seat.student.animalGenius[0]
                                                : '•'}
                                            </div>
                                          </>
                                        ) : (
                                          <div className="text-gray-400">Empty</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {layoutType === "rows" && (
                            <div className="space-y-3">
                              {seatingArrangement.map((row) => (
                                <div key={row.id} className="flex justify-center">
                                  <div className="flex gap-2">
                                    {row.seats.map((seat) => (
                                      <div
                                        key={seat.id}
                                        className={`p-2 rounded border-2 border-dashed border-gray-300 min-h-[60px] w-20 flex flex-col items-center justify-center text-xs
                                          ${seat.student ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}
                                        `}
                                      >
                                        {seat.student ? (
                                          <>
                                            <div className="font-medium truncate w-full text-center">
                                              {seat.student.studentName.split(' ')[0]}
                                            </div>
                                            <div className="flex justify-center items-center">
                                              <img 
                                                src={getAnimalImagePath(seat.student.animalType)} 
                                                alt={seat.student.animalType}
                                                className="w-6 h-6 object-contain"
                                              />
                                            </div>
                                          </>
                                        ) : (
                                          <div className="text-gray-400">Empty</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {(layoutType === "tables6" || layoutType === "groups3") && (
                            <div className={`grid gap-4 ${layoutType === "tables6" ? "grid-cols-2" : "grid-cols-4"}`}>
                              {seatingArrangement.map((table) => (
                                <div key={table.id} className="border-2 border-gray-200 rounded-lg p-3">
                                  <div className="text-xs font-medium text-gray-500 mb-2 text-center">
                                    {table.id}
                                  </div>
                                  <div className={`grid gap-2 ${layoutType === "tables6" ? "grid-cols-3" : "grid-cols-3"}`}>
                                    {table.seats.map((seat) => (
                                      <div
                                        key={seat.id}
                                        className={`p-2 rounded border-2 border-dashed border-gray-300 min-h-[60px] flex flex-col items-center justify-center text-xs
                                          ${seat.student ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}
                                        `}
                                      >
                                        {seat.student ? (
                                          <>
                                            <div className="font-medium truncate w-full text-center">
                                              {seat.student.studentName.split(' ')[0]}
                                            </div>
                                            <div className="flex justify-center items-center">
                                              <img 
                                                src={getAnimalImagePath(seat.student.animalType)} 
                                                alt={seat.student.animalType}
                                                className="w-6 h-6 object-contain"
                                              />
                                            </div>
                                          </>
                                        ) : (
                                          <div className="text-gray-400">Empty</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Legend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Legend</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {seatingStrategy === "energyBalance" && (
                        <div>
                          <div className="text-sm font-medium mb-2">Energy Types</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                              <span className="text-sm">Extrovert (E)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                              <span className="text-sm">Introvert (I)</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {seatingStrategy === "geniusBalance" && (
                        <div>
                          <div className="text-sm font-medium mb-2">Animal Genius</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                              <span className="text-sm">Thinker</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-pink-100 border border-pink-300 rounded"></div>
                              <span className="text-sm">Feeler</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                              <span className="text-sm">Doer</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Unassigned Students */}
                  {unassignedStudents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Unassigned</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {unassignedStudents.map((student) => (
                            <div
                              key={student.id}
                              className="p-2 bg-amber-50 border border-amber-200 rounded text-sm"
                            >
                              {student.studentName}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tips */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 space-y-2">
                        {seatingStrategy === "energyBalance" && (
                          <p>Balanced tables have a mix of introverts and extroverts for optimal collaboration.</p>
                        )}
                        {seatingStrategy === "geniusBalance" && (
                          <p>Each table ideally has Thinkers, Feelers, and Doers for diverse perspectives.</p>
                        )}
                        {seatingStrategy === "smartMix" && (
                          <p>This arrangement balances both energy levels and thinking styles for maximum effectiveness.</p>
                        )}
                        <p>Click seats to swap students if needed.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}