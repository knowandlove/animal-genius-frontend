import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import { CheckCircle, XCircle, Loader2, UserPlus } from "lucide-react";

export default function AcceptInvitation() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');

  const acceptInvitationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/collaborators/accept/${token}`);
    },
    onSuccess: (data) => {
      setStatus('success');
      setMessage(data.message || 'Invitation accepted successfully!');
      toast({
        title: "Success",
        description: "You've been added as a co-teacher to the class.",
      });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setLocation('/dashboard');
      }, 2000);
    },
    onError: (error: Error) => {
      setStatus('error');
      setMessage(error.message || 'Failed to accept invitation');
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      // Store the invitation token in session storage
      sessionStorage.setItem('pendingInvitation', token!);
      // Redirect to login
      setLocation(`/login?redirect=/accept-invitation/${token}`);
      return;
    }

    if (!authLoading && user && token && status === 'pending') {
      // Auto-accept the invitation
      acceptInvitationMutation.mutate();
    }
  }, [authLoading, user, token, status]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header isAuthenticated={!!user} user={user || undefined} onLogout={() => {}} />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Co-Teacher Invitation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status === 'pending' && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600">Processing your invitation...</p>
                </div>
              )}
              
              {status === 'success' && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">Welcome aboard!</h3>
                  <p className="text-gray-600 mb-4">{message}</p>
                  <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
                </div>
              )}
              
              {status === 'error' && (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2">Invitation Error</h3>
                  <p className="text-gray-600 mb-6">{message}</p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setLocation('/dashboard')}
                      variant="outline"
                      className="w-full"
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      onClick={() => acceptInvitationMutation.mutate()}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}