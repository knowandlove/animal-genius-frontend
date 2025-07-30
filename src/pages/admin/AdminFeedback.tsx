import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";
import { AdminFeedbackDashboard } from "@/components/admin/AdminFeedbackDashboard";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminFeedback() {
  // Check if user is admin
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: () => apiRequest("GET", "/api/me"),
  });

  if (userLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!user?.isAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-muted-foreground">
                You must be an administrator to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Lesson Feedback</h1>
          <p className="text-muted-foreground mt-2">
            View and analyze feedback from teachers about Learning Lounge lessons.
          </p>
        </div>
        
        <AdminFeedbackDashboard />
      </div>
    </AuthenticatedLayout>
  );
}