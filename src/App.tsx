import { useState, useEffect, lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StoreDataProvider } from "@/contexts/StoreDataContext";
import ErrorBoundary from "@/components/error-boundary";
import { preloadRiveRuntime } from "@/utils/rive-runtime-loader";

// Lazy load all page components
const Landing = lazy(() => import("@/pages/Landing"));
const TeacherLogin = lazy(() => import("@/pages/teacher-login"));
const TeacherRegistration = lazy(() => import("@/pages/teacher-registration"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const StudentLogin = lazy(() => import("@/pages/StudentLogin"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const StudentQuizResults = lazy(() => import("@/pages/StudentQuizResults"));
const StudentAchievements = lazy(() => import("@/pages/StudentAchievements"));
import { ProtectedStudentRoute } from "@/components/ProtectedStudentRoute";
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
const ClassSettings = lazy(() => import("@/pages/class-settings"));
const TeacherStudentView = lazy(() => import("@/pages/teacher-student-view"));
const TeacherPersonalityResults = lazy(() => import("@/pages/teacher-personality-results"));
const LiveDiscoveryBoard = lazy(() => import("@/pages/LiveDiscoveryBoard"));
const NotFound = lazy(() => import("@/pages/not-found"));
const StudentRoom = lazy(() => import("@/pages/StudentRoom"));
const ClassIsland = lazy(() => import("@/pages/ClassIsland"));
const ColorPreview = lazy(() => import("@/pages/color-preview"));
const ClassEconomy = lazy(() => import("@/pages/class-economy"));
const ClassDashboard = lazy(() => import("@/pages/class-dashboard"));
const ClassValuesVoting = lazy(() => import("@/pages/ClassValuesVoting"));
const ClassValuesResults = lazy(() => import("@/pages/ClassValuesResults"));
const JoinClass = lazy(() => import("@/pages/JoinClass"));
const CommunityHub = lazy(() => import("@/pages/community/CommunityHub"));
const DiscussionDetail = lazy(() => import("@/pages/community/DiscussionDetail"));
// Test pages removed during cleanup
const AvatarEditor = lazy(() => import("@/pages/avatar-editor"));
const AvatarItemPositioner = lazy(() => import("@/pages/admin/avatar-item-positioner"));
const TestParrot = lazy(() => import("@/pages/test-parrot"));
const TestSVGAvatar = lazy(() => import("@/pages/test-svg-avatar"));
const AvatarItemPositionerV2 = lazy(() => import("@/pages/admin/avatar-item-positioner-v2"));
// const AddStoreItem = lazy(() => import("@/pages/admin/add-store-item")); // Removed - use StoreManagement instead
const StoreManagement = lazy(() => import("@/pages/admin/store-management-direct"));
const PetManagement = lazy(() => import("@/pages/admin/pet-management"));
const AnimalSizer = lazy(() => import("@/pages/admin/animal-sizer"));
const BulkPositionUpdate = lazy(() => import("@/pages/admin/bulk-position-update"));
const MakeAdmin = lazy(() => import("@/pages/admin/make-admin"));
const DiagnosticCheck = lazy(() => import("@/pages/admin/diagnostic-check"));
const AdminFeedback = lazy(() => import("@/pages/admin/AdminFeedback"));
const CustomizerTest = lazy(() => import("@/pages/CustomizerTest"));
// Test admin pages removed during cleanup

// Import the properly configured query client
import { queryClient } from "@/lib/queryClient";
// Legacy auth utilities removed - now using Supabase Auth for teachers and passport codes for students



const RedirectToLogin = () => {
  window.location.href = '/login';
  return null;
};

function Router() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Preload Rive runtime on app initialization
    preloadRiveRuntime().catch(() => {
      // Failed to preload Rive runtime - will load on demand
    });
    
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
    const existingToken = localStorage.getItem("authToken");
    setToken(existingToken);
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
        
        {/* Class values voting - available to students via direct link */}
        <Route path="/class-values-voting/:sessionId" component={ClassValuesVoting} />
        
        {/* Class values results - available to teachers */}
        <Route path="/class-values-results/:classId" component={ClassValuesResults} />
        
        
        {/* Student authentication and room routes */}
        <Route path="/student-login" component={StudentLogin} />
        <Route path="/student/login" component={StudentLogin} />
        <Route path="/student/dashboard">
          <ProtectedStudentRoute>
            <StudentDashboard />
          </ProtectedStudentRoute>
        </Route>
        <Route path="/student/quiz-results">
          <ProtectedStudentRoute>
            <StudentQuizResults />
          </ProtectedStudentRoute>
        </Route>
        <Route path="/student/achievements">
          <ProtectedStudentRoute>
            <StudentAchievements />
          </ProtectedStudentRoute>
        </Route>
        
        {/* Legacy student room routes (backward compatibility) */}
        <Route path="/island/:passportCode" component={StudentRoom} />
        <Route path="/room/:passportCode" component={StudentRoom} />
        <Route path="/student-room/:passportCode" component={StudentRoom} />
        <Route path="/class-island" component={ClassIsland} />
        <Route path="/class/:classCode/island" component={ClassIsland} />
        <Route path="/class/:classCode" component={ClassIsland} />
        
        {/* Student join page */}
        <Route path="/join" component={JoinClass} />
        
        {/* Test/Development routes - removed during cleanup */}
        <Route path="/avatar-editor" component={AvatarEditor} />
        <Route path="/test-svg-avatar" component={TestSVGAvatar} />
        
        {/* Authentication routes - always available */}
        <Route path="/register" component={TeacherRegistration} />
        <Route path="/login" component={TeacherLogin} />
        <Route path="/reset-password" component={ResetPassword} />
        
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
            <Route path="/classes/:classId/dashboard" component={ClassDashboard} />
            <Route path="/class/:classId/dashboard" component={ClassDashboard} />
            <Route path="/class/:classId" component={ClassDashboard} />
            <Route path="/class/:classId/settings" component={ClassSettings} />
            <Route path="/class/:classId/economy" component={ClassEconomy} />
            <Route path="/classes/:classId/economy" component={ClassEconomy} />
            <Route path="/class-report/:classId" component={ClassReport} />
            <Route path="/classes/:id/live" component={LiveDiscoveryBoard} />
            <Route path="/teacher/student/:submissionId" component={TeacherStudentView} />
            <Route path="/teacher/personality-results" component={TeacherPersonalityResults} />
            <Route path="/submission/:submissionId/report" component={StudentReport} />
            <Route path="/pre-assessment" component={PreAssessment} />
            <Route path="/group-maker" component={GroupMaker} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/teacher/class/:classId/island" component={ClassIsland} />
            <Route path="/community" component={CommunityHub} />
            <Route path="/community/discussion/:id" component={DiscussionDetail} />
            <Route path="/colors" component={ColorPreview} />
            <Route path="/admin/item-positioner" component={AvatarItemPositioner} />
            <Route path="/admin/item-positioner-v2" component={AvatarItemPositionerV2} />
            {/* <Route path="/admin/add-item" component={AddStoreItem} /> */}
            <Route path="/admin/store" component={StoreManagement} />
            <Route path="/admin/pets" component={PetManagement} />
            <Route path="/admin/animal-sizer" component={AnimalSizer} />
            <Route path="/admin/bulk-update" component={BulkPositionUpdate} />
            <Route path="/admin/make-admin" component={MakeAdmin} />
            <Route path="/admin/diagnostic" component={DiagnosticCheck} />
            <Route path="/admin/feedback" component={AdminFeedback} />
            <Route path="/test/customizer" component={CustomizerTest} />
            <Route path="/test/parrot" component={TestParrot} />
            {/* Test admin routes removed during cleanup */}
          </>
        ) : (
          <>
            {/* Redirect protected routes to login when not authenticated */}
            <Route path="/" component={Landing} />
            <Route path="/dashboard" component={RedirectToLogin} />
            <Route path="/account" component={RedirectToLogin} />
            <Route path="/create-class" component={RedirectToLogin} />
            <Route path="/learning-lounge" component={RedirectToLogin} />
            <Route path="/classes/:classId/analytics" component={RedirectToLogin} />
            <Route path="/class/:classId/analytics" component={RedirectToLogin} />
            <Route path="/classes/:classId/dashboard" component={RedirectToLogin} />
            <Route path="/class/:classId/dashboard" component={RedirectToLogin} />
            <Route path="/class/:classId" component={RedirectToLogin} />
            <Route path="/class/:classId/settings" component={RedirectToLogin} />
            <Route path="/class/:classId/economy" component={RedirectToLogin} />
            <Route path="/classes/:classId/economy" component={RedirectToLogin} />
            <Route path="/class-report/:classId" component={RedirectToLogin} />
            <Route path="/teacher/student/:submissionId" component={RedirectToLogin} />
            <Route path="/teacher/personality-results" component={RedirectToLogin} />
            <Route path="/submission/:submissionId/report" component={RedirectToLogin} />
            <Route path="/pre-assessment" component={RedirectToLogin} />
            <Route path="/community" component={RedirectToLogin} />
            <Route path="/community/discussion/:id" component={RedirectToLogin} />
            <Route path="/admin" component={RedirectToLogin} />
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