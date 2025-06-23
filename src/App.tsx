import { useState, useEffect, lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StoreDataProvider } from "@/contexts/StoreDataContext";
import ErrorBoundary from "@/components/error-boundary";

// Lazy load all page components
const Landing = lazy(() => import("@/pages/Landing"));
const TeacherLogin = lazy(() => import("@/pages/teacher-login"));
const TeacherRegistration = lazy(() => import("@/pages/teacher-registration"));
const TeacherDashboard = lazy(() => import("@/pages/teacher-dashboard"));
const CreateClass = lazy(() => import("@/pages/create-class"));
const ClassAnalytics = lazy(() => import("@/pages/class-analytics"));
const Account = lazy(() => import("@/pages/account"));
const LearningLounge = lazy(() => import("@/pages/learning-lounge"));
const StudentQuiz = lazy(() => import("@/pages/student-quiz"));
const QuizResults = lazy(() => import("@/pages/quiz-results"));
const StudentReport = lazy(() => import("@/pages/student-report"));
const PreAssessment = lazy(() => import("@/pages/pre-assessment"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const GroupMaker = lazy(() => import("@/pages/group-maker"));
const ClassReport = lazy(() => import("@/pages/class-report"));
const TeacherStudentView = lazy(() => import("@/pages/teacher-student-view"));
const TeacherPersonalityResults = lazy(() => import("@/pages/teacher-personality-results"));
const LiveDiscoveryBoard = lazy(() => import("@/pages/LiveDiscoveryBoard"));
const NotFound = lazy(() => import("@/pages/not-found"));
const GameJoin = lazy(() => import("@/pages/game-join"));
const GameLobby = lazy(() => import("@/pages/game-lobby"));
const GamePlay = lazy(() => import("@/pages/game-play"));
const StudentIsland = lazy(() => import("@/pages/StudentIsland-v4"));
const GameCreate = lazy(() => import("@/pages/teacher/game-create"));
const TeacherGameDashboard = lazy(() => import("@/pages/teacher/game-dashboard"));
const ColorPreview = lazy(() => import("@/pages/color-preview"));
const ClassEconomy = lazy(() => import("@/pages/class-economy"));
const AvatarTest = lazy(() => import("@/pages/avatar-test"));
const AvatarTestV2 = lazy(() => import("@/pages/avatar-test-v2"));
const AvatarEditor = lazy(() => import("@/pages/avatar-editor"));
const AvatarItemPositioner = lazy(() => import("@/pages/admin/avatar-item-positioner"));
// const AddStoreItem = lazy(() => import("@/pages/admin/add-store-item")); // Removed - use StoreManagement instead
const StoreManagement = lazy(() => import("@/pages/admin/store-management-direct"));
const AnimalSizer = lazy(() => import("@/pages/admin/animal-sizer"));
const BulkPositionUpdate = lazy(() => import("@/pages/admin/bulk-position-update"));
const MakeAdmin = lazy(() => import("@/pages/admin/make-admin"));
const DiagnosticCheck = lazy(() => import("@/pages/admin/diagnostic-check"));
const DebugAuth = lazy(() => import("@/pages/admin/debug-auth"));
const TestAdmin = lazy(() => import("@/pages/admin/test-admin"));
const TestPositions = lazy(() => import("@/pages/admin/test-positions"));
const AvatarSizeDebug = lazy(() => import("@/pages/admin/avatar-size-debug"));

// Import the properly configured query client
import { queryClient } from "@/lib/queryClient";
import { checkAuthStateOnLoad } from "@/lib/auth-utils";
// Import auth cleanup to run immediately on app load
import "@/lib/auth-cleanup";



function Router() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check and clean up authentication state first
    const hasValidAuth = checkAuthStateOnLoad();
    
    // Check for SSO token in URL first
    const urlParams = new URLSearchParams(window.location.search);
    const ssoToken = urlParams.get('token');
    
    if (ssoToken) {
      localStorage.setItem('authToken', ssoToken);
      setToken(ssoToken);
      
      // Clean up URL without the token parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      window.history.replaceState({}, '', newUrl.toString());
      
      setIsLoading(false);
      return;
    }

    // Check for existing token in localStorage
    const authToken = localStorage.getItem("authToken");
    setToken(authToken);
    setIsLoading(false);

    // Listen for storage changes to update token state
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("authToken");
      setToken(newToken);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-window localStorage changes
    window.addEventListener('authTokenChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authTokenChanged', handleStorageChange);
    };
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
      <Switch>
        {/* Student quiz routes - always available with /q/ prefix */}
        <Route path="/q/:classCode" component={StudentQuiz} />
        <Route path="/results/:submissionId" component={QuizResults} />
        
        {/* Student island route - always available */}
        <Route path="/island/:passportCode" component={StudentIsland} />
        
        {/* Game routes - always available */}
        <Route path="/game/join" component={GameJoin} />
        <Route path="/game/:gameId/lobby" component={GameLobby} />
        <Route path="/game/:gameId/play" component={GamePlay} />
        
        {/* Test/Development routes - always available */}
        <Route path="/avatar-test" component={AvatarTest} />
        <Route path="/avatar-test-v2" component={AvatarTestV2} />
        <Route path="/avatar-editor" component={AvatarEditor} />
        
        {/* Authentication routes - always available */}
        <Route path="/register" component={TeacherRegistration} />
        <Route path="/login" component={TeacherLogin} />
        
        {/* Protected teacher routes - only when authenticated */}
        {token ? (
          <>
            <Route path="/" component={TeacherDashboard} />
            <Route path="/dashboard" component={TeacherDashboard} />
            <Route path="/account" component={Account} />
            <Route path="/create-class" component={CreateClass} />
            <Route path="/learning-lounge" component={LearningLounge} />
            <Route path="/classes/:classId/analytics" component={ClassAnalytics} />
            <Route path="/class/:classId/analytics" component={ClassAnalytics} />
            <Route path="/classes/:classId/economy" component={ClassEconomy} />
            <Route path="/class-report/:classId" component={ClassReport} />
            <Route path="/classes/:id/live" component={LiveDiscoveryBoard} />
            <Route path="/teacher/student/:submissionId" component={TeacherStudentView} />
            <Route path="/teacher/personality-results" component={TeacherPersonalityResults} />
            <Route path="/submission/:submissionId/report" component={StudentReport} />
            <Route path="/pre-assessment" component={PreAssessment} />
            <Route path="/group-maker" component={GroupMaker} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/teacher/game/create" component={GameCreate} />
            <Route path="/teacher/game/:gameId" component={TeacherGameDashboard} />
            <Route path="/colors" component={ColorPreview} />
            <Route path="/admin/item-positioner" component={AvatarItemPositioner} />
            {/* <Route path="/admin/add-item" component={AddStoreItem} /> */}
            <Route path="/admin/store" component={StoreManagement} />
            <Route path="/admin/animal-sizer" component={AnimalSizer} />
            <Route path="/admin/bulk-update" component={BulkPositionUpdate} />
            <Route path="/admin/make-admin" component={MakeAdmin} />
            <Route path="/admin/diagnostic" component={DiagnosticCheck} />
            <Route path="/admin/debug-auth" component={DebugAuth} />
            <Route path="/admin/test-admin" component={TestAdmin} />
            <Route path="/admin/test-positions" component={TestPositions} />
            <Route path="/admin/avatar-debug" component={AvatarSizeDebug} />
          </>
        ) : (
          <>
            {/* Redirect protected routes to login when not authenticated */}
            <Route path="/" component={Landing} />
            <Route path="/dashboard" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/account" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/create-class" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/learning-lounge" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/classes/:classId/analytics" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/class/:classId/analytics" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/classes/:classId/economy" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/class-report/:classId" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/teacher/student/:submissionId" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/teacher/personality-results" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/submission/:submissionId/report" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/pre-assessment" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/admin" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/teacher/game/create" component={() => { window.location.href = '/login'; return null; }} />
            <Route path="/teacher/game/:gameId" component={() => { window.location.href = '/login'; return null; }} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreDataProvider>
        <TooltipProvider>
          <Toaster />
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </StoreDataProvider>
    </QueryClientProvider>
  );
}

export default App;